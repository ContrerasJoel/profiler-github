import { z } from 'zod';

/**
 * Regla oficial de GitHub para usernames:
 * alfanuméricos y guiones simples, sin empezar ni terminar en guion, máx. 39 caracteres.
 */
export const GITHUB_USERNAME_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

export const usernameSchema = z
  .string()
  .trim()
  .min(1, 'El username es obligatorio.')
  .max(39, 'Un username de GitHub no puede superar los 39 caracteres.')
  .regex(
    GITHUB_USERNAME_REGEX,
    'Username inválido. Solo se permiten letras, números y guiones simples, sin empezar ni terminar en guion.',
  );

export type Username = z.infer<typeof usernameSchema>;
