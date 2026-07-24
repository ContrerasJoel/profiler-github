import { z } from 'zod';

/**
 * Copia espejo del contrato que expone el backend (`backend/src/user/schemas/profile.schema.ts`).
 *
 * Está duplicada a propósito: el repo usa dos proyectos independientes en vez de un
 * monorepo con paquetes compartidos, así que cada uno se despliega solo y sin build
 * cruzado. El coste de la duplicación es bajo y está acotado, y a cambio validamos la
 * respuesta en el cliente: si el backend cambia el contrato, salta aquí con un mensaje
 * claro en vez de romperse a mitad de un gráfico.
 */

export const GITHUB_USERNAME_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

export const usernameSchema = z
  .string()
  .trim()
  .min(1, 'Escribí un nombre de usuario.')
  .max(39, 'Un usuario de GitHub no puede tener más de 39 caracteres.')
  .regex(
    GITHUB_USERNAME_REGEX,
    'Solo se permiten letras, números y guiones simples, sin empezar ni terminar en guion.',
  );

export const profileSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  avatarUrl: z.string(),
  bio: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  blog: z.string().nullable(),
  twitterUsername: z.string().nullable(),
  email: z.string().nullable(),
  hireable: z.boolean().nullable(),
  type: z.string(),
  publicRepos: z.number(),
  publicGists: z.number(),
  followers: z.number(),
  following: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  htmlUrl: z.string(),
});

export const statsSchema = z.object({
  totalStars: z.number(),
  totalForks: z.number(),
  totalWatchers: z.number(),
  totalOpenIssues: z.number(),
  ownRepos: z.number(),
  forkedRepos: z.number(),
  archivedRepos: z.number(),
  languagesCount: z.number(),
  accountAgeYears: z.number(),
  mostStarredRepo: z
    .object({ name: z.string(), stars: z.number(), htmlUrl: z.string() })
    .nullable(),
});

export const languageSliceSchema = z.object({
  name: z.string(),
  count: z.number(),
  percentage: z.number(),
});

export const topRepoSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  stars: z.number(),
  forks: z.number(),
  language: z.string().nullable(),
  topics: z.array(z.string()),
  htmlUrl: z.string(),
  updatedAt: z.string(),
});

export const yearBucketSchema = z.object({
  year: z.string(),
  count: z.number(),
});

export const recentRepoSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stars: z.number(),
  pushedAt: z.string().nullable(),
  htmlUrl: z.string(),
});

export const metaSchema = z.object({
  fetchedAt: z.string(),
  cached: z.boolean(),
  reposAnalyzed: z.number(),
  reposTruncated: z.boolean(),
  rateLimitRemaining: z.number().nullable(),
});

export const profileResponseSchema = z.object({
  profile: profileSchema,
  stats: statsSchema,
  languages: z.array(languageSliceSchema),
  topRepos: z.array(topRepoSchema),
  reposPerYear: z.array(yearBucketSchema),
  recentRepos: z.array(recentRepoSchema),
  meta: metaSchema,
});

export type Profile = z.infer<typeof profileSchema>;
export type Stats = z.infer<typeof statsSchema>;
export type LanguageSlice = z.infer<typeof languageSliceSchema>;
export type TopRepo = z.infer<typeof topRepoSchema>;
export type YearBucket = z.infer<typeof yearBucketSchema>;
export type RecentRepo = z.infer<typeof recentRepoSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
