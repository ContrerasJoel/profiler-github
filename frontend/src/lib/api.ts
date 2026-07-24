import { profileResponseSchema, type ProfileResponse } from './schemas';

/**
 * Base del backend propio en NestJS. El frontend nunca llama a api.github.com
 * directamente: todo pasa por nuestro endpoint, que es lo que pide el reto (y lo que
 * mantiene el token de GitHub fuera del navegador).
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? 'ContrerasJoel';

/**
 * Sin este límite, si la API deja de responder (reinicio, proxy mal configurado) el
 * `fetch` queda colgado hasta que el navegador decida cortarlo, y la página se queda
 * indefinidamente en el esqueleto de carga: el usuario no distingue "lento" de "roto".
 */
const REQUEST_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchProfile(
  username: string,
  signal?: AbortSignal,
): Promise<ProfileResponse> {
  let response: Response;

  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  try {
    response = await fetch(`${API_URL}/user/${encodeURIComponent(username)}`, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error instanceof DOMException) {
      // Se agotó el tiempo: la API existe pero no contesta.
      if (error.name === 'TimeoutError') {
        throw new ApiError(
          'La API tardó demasiado en responder. Puede estar caída o reiniciándose.',
          504,
        );
      }

      // Cancelación explícita del llamador: no es un fallo, lo propagamos para que
      // el store lo ignore en vez de pintar un error.
      if (error.name === 'AbortError') throw error;
    }

    throw new ApiError(
      'No se pudo conectar con la API. Verificá que el backend esté levantado.',
      0,
    );
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  const parsed = profileResponseSchema.safeParse(await response.json());

  if (!parsed.success) {
    // El backend respondió 200 pero con una forma que no esperábamos: normalmente
    // significa que front y back quedaron desincronizados tras un deploy.
    console.error('Respuesta con formato inesperado:', parsed.error.issues);
    throw new ApiError('La API devolvió datos en un formato inesperado.', 500);
  }

  return parsed.data;
}

/** El backend unifica sus errores en `{ message }`; esto solo lo desenvuelve con cuidado. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();

    if (body && typeof body === 'object' && 'message' in body) {
      const { message } = body as { message: unknown };
      if (typeof message === 'string') return message;
      if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
    }
  } catch {
    // Cuerpo vacío o no-JSON: caemos al mensaje genérico.
  }

  return `La API respondió con un error (${response.status}).`;
}
