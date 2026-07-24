import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import {
  githubRepoListSchema,
  githubUserSchema,
  type GithubRepo,
  type GithubUser,
} from './schemas/github.schema';

const GITHUB_API = 'https://api.github.com';
const REPOS_PER_PAGE = 100;
/** Tope de páginas: 300 repos cubre prácticamente cualquier perfil sin castigar el rate limit. */
const MAX_REPO_PAGES = 3;
const REQUEST_TIMEOUT_MS = 10_000;

export interface GithubResult<T> {
  data: T;
  rateLimitRemaining: number | null;
}

/**
 * Único punto de contacto con api.github.com.
 *
 * Aísla tres cosas del resto de la app: la autenticación con el PAT (que nunca sale
 * del backend), la traducción de los errores de GitHub a excepciones de Nest, y la
 * paginación de repositorios.
 */
@Injectable()
export class GithubClient {
  private readonly logger = new Logger(GithubClient.name);
  private readonly token?: string;

  constructor(config: ConfigService) {
    this.token = config.get<string>('GITHUB_TOKEN')?.trim() || undefined;

    if (!this.token) {
      this.logger.warn(
        'GITHUB_TOKEN no configurado: la API pública limita a 60 peticiones/hora por IP.',
      );
    }
  }

  async fetchUser(username: string): Promise<GithubResult<GithubUser>> {
    return this.request(`/users/${encodeURIComponent(username)}`, githubUserSchema, username);
  }

  /**
   * Trae los repositorios públicos ordenados por actividad reciente, paginando hasta
   * `MAX_REPO_PAGES`. `truncated` avisa de que el perfil tiene más de los analizados,
   * para que el frontend pueda ser honesto sobre el alcance de las métricas.
   */
  async fetchRepos(
    username: string,
  ): Promise<GithubResult<GithubRepo[]> & { truncated: boolean }> {
    const repos: GithubRepo[] = [];
    let rateLimitRemaining: number | null = null;
    let truncated = false;

    for (let page = 1; page <= MAX_REPO_PAGES; page += 1) {
      const result = await this.request(
        `/users/${encodeURIComponent(username)}/repos?per_page=${REPOS_PER_PAGE}&sort=pushed&page=${page}`,
        githubRepoListSchema,
        username,
      );

      repos.push(...result.data);
      rateLimitRemaining = result.rateLimitRemaining;

      // Una página incompleta significa que ya no hay más resultados.
      if (result.data.length < REPOS_PER_PAGE) break;

      if (page === MAX_REPO_PAGES) truncated = true;
    }

    return { data: repos, rateLimitRemaining, truncated };
  }

  private async request<T>(
    path: string,
    schema: z.ZodType<T>,
    username: string,
  ): Promise<GithubResult<T>> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'profiler-github',
    };

    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    let response: Response;

    try {
      response = await fetch(`${GITHUB_API}${path}`, {
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Fallo de red hacia GitHub (${path}): ${reason}`);
      throw new ServiceUnavailableException(
        'No se pudo contactar con la API de GitHub. Intentalo de nuevo en unos segundos.',
      );
    }

    const rateLimitRemaining = parseHeaderNumber(response.headers.get('x-ratelimit-remaining'));

    if (!response.ok) {
      throw this.toHttpException(response, rateLimitRemaining, username);
    }

    const parsed = schema.safeParse(await response.json());

    if (!parsed.success) {
      // Si esto salta, GitHub cambió su contrato: preferimos fallar fuerte y con detalle
      // antes que servir métricas calculadas sobre campos ausentes.
      this.logger.error(
        `Respuesta inesperada de GitHub (${path}): ${JSON.stringify(parsed.error.issues.slice(0, 5))}`,
      );
      throw new ServiceUnavailableException(
        'La API de GitHub devolvió una respuesta con un formato inesperado.',
      );
    }

    return { data: parsed.data, rateLimitRemaining };
  }

  private toHttpException(
    response: Response,
    rateLimitRemaining: number | null,
    username: string,
  ): HttpException {
    if (response.status === HttpStatus.NOT_FOUND) {
      return new NotFoundException(`El usuario "${username}" no existe en GitHub.`);
    }

    // GitHub responde 403 (no 429) cuando se agota el rate limit; se distingue por el header.
    const isRateLimited =
      response.status === HttpStatus.TOO_MANY_REQUESTS ||
      (response.status === HttpStatus.FORBIDDEN && rateLimitRemaining === 0);

    if (isRateLimited) {
      const reset = parseHeaderNumber(response.headers.get('x-ratelimit-reset'));
      const retryInSeconds = reset ? Math.max(0, reset - Math.floor(Date.now() / 1000)) : null;

      this.logger.warn(`Rate limit de GitHub agotado. Reset en ${retryInSeconds ?? '?'}s.`);

      return new HttpException(
        {
          message: retryInSeconds
            ? `Se agotó el límite de peticiones a GitHub. Volvé a intentarlo en ${Math.ceil(retryInSeconds / 60)} minuto(s).`
            : 'Se agotó el límite de peticiones a GitHub. Intentalo más tarde.',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (response.status === HttpStatus.UNAUTHORIZED) {
      this.logger.error('GitHub rechazó el token: revisá GITHUB_TOKEN.');
      return new ServiceUnavailableException(
        'El servidor no pudo autenticarse contra la API de GitHub.',
      );
    }

    this.logger.error(`GitHub respondió ${response.status} para ${username}.`);
    return new ServiceUnavailableException(
      `La API de GitHub respondió con un error (${response.status}).`,
    );
  }
}

function parseHeaderNumber(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
