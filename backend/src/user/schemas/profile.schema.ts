import { z } from 'zod';

/**
 * Contrato público de `GET /user/:username`.
 *
 * Es la única fuente de verdad de la forma de la respuesta: los tipos salen de aquí
 * con `z.infer`, y el frontend mantiene una copia espejo de este archivo para validar
 * lo que recibe.
 */

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
