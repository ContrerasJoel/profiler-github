import { create } from 'zustand';
import { ApiError, fetchProfile } from '@/lib/api';
import type { ProfileResponse } from '@/lib/schemas';

export type ProfileStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ProfileError {
  message: string;
  status: number;
}

interface ProfileState {
  /** Usuario cuyos datos están (o van a estar) en `data`. */
  username: string;
  data: ProfileResponse | null;
  status: ProfileStatus;
  error: ProfileError | null;
  /** Usuarios buscados en esta sesión, para volver a ellos con un clic. */
  history: string[];
  loadProfile: (username: string) => Promise<void>;
  retry: () => Promise<void>;
}

const MAX_HISTORY = 6;

/**
 * Contador de peticiones para descartar respuestas obsoletas.
 *
 * Sin esto, buscar "a" y enseguida "b" puede pintar el perfil de "a" si su respuesta
 * llega la última. Vive fuera del store porque es un detalle de control de concurrencia,
 * no estado que la UI deba observar.
 */
let latestRequestId = 0;

export const useProfileStore = create<ProfileState>((set, get) => ({
  username: '',
  data: null,
  status: 'idle',
  error: null,
  history: [],

  loadProfile: async (username: string) => {
    const trimmed = username.trim();
    if (!trimmed) return;

    const requestId = (latestRequestId += 1);

    set({ username: trimmed, status: 'loading', error: null });

    try {
      const data = await fetchProfile(trimmed);

      // Llegó tarde: ya hay una búsqueda más nueva en curso.
      if (requestId !== latestRequestId) return;

      set({
        data,
        status: 'success',
        error: null,
        // Guardamos el login canónico de GitHub, no lo que se tecleó: así "TORVALDS"
        // y "torvalds" no ocupan dos entradas distintas del historial.
        username: data.profile.login,
        history: addToHistory(get().history, data.profile.login),
      });
    } catch (error) {
      if (requestId !== latestRequestId) return;

      set({
        data: null,
        status: 'error',
        error:
          error instanceof ApiError
            ? { message: error.message, status: error.status }
            : { message: 'Ocurrió un error inesperado.', status: 0 },
      });
    }
  },

  retry: async () => {
    const { username, loadProfile } = get();
    if (username) await loadProfile(username);
  },
}));

function addToHistory(history: string[], login: string): string[] {
  const withoutDuplicate = history.filter(
    (entry) => entry.toLowerCase() !== login.toLowerCase(),
  );

  return [login, ...withoutDuplicate].slice(0, MAX_HISTORY);
}
