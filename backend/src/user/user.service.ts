import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../common/cache.service';
import { GithubClient } from './github.client';
import { buildProfileResponse } from './profile.mapper';
import type { ProfileResponse } from './schemas/profile.schema';

const DEFAULT_CACHE_TTL_SECONDS = 300;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly cacheTtl: number;

  constructor(
    private readonly github: GithubClient,
    private readonly cache: CacheService,
    config: ConfigService,
  ) {
    const configured = Number(config.get<string>('CACHE_TTL'));
    this.cacheTtl = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_CACHE_TTL_SECONDS;
  }

  /**
   * Devuelve el perfil ya agregado y listo para renderizar.
   *
   * Toda la agregación vive aquí y no en el frontend: el cliente recibe justo lo que
   * necesita pintar (sin arrays de 300 repos que no va a usar) y la lógica queda en un
   * único sitio testeable.
   */
  async getProfile(username: string): Promise<ProfileResponse> {
    // GitHub trata los usernames como case-insensitive: normalizamos la clave para no
    // guardar "Torvalds" y "torvalds" como dos entradas distintas.
    const cacheKey = `user:${username.toLowerCase()}`;
    const cached = this.cache.get<ProfileResponse>(cacheKey);

    if (cached) {
      this.logger.log(`Perfil "${username}" servido desde caché.`);
      return { ...cached, meta: { ...cached.meta, cached: true } };
    }

    const startedAt = Date.now();

    const [user, repos] = await Promise.all([
      this.github.fetchUser(username),
      this.github.fetchRepos(username),
    ]);

    const response = buildProfileResponse(user.data, repos.data, {
      fetchedAt: new Date().toISOString(),
      cached: false,
      reposAnalyzed: repos.data.length,
      reposTruncated: repos.truncated,
      rateLimitRemaining: repos.rateLimitRemaining ?? user.rateLimitRemaining,
    });

    this.cache.set(cacheKey, response, this.cacheTtl);

    this.logger.log(
      `Perfil "${user.data.login}" agregado en ${Date.now() - startedAt}ms ` +
        `(${repos.data.length} repos, rate limit restante: ${response.meta.rateLimitRemaining ?? 'n/d'}).`,
    );

    return response;
  }
}
