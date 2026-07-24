import { z } from 'zod';

/**
 * Forma *cruda* de las respuestas de api.github.com que realmente consumimos.
 *
 * Validamos también lo que entra (no solo lo que sale): si GitHub cambia un contrato
 * el fallo es explícito y localizado, en vez de propagarse como `undefined` silencioso
 * hasta un gráfico vacío en el frontend. Zod descarta las claves que no declaramos,
 * así que la respuesta que manejamos es exactamente la que documentamos.
 */

export const githubUserSchema = z.object({
  login: z.string(),
  name: z.string().nullish(),
  avatar_url: z.string(),
  bio: z.string().nullish(),
  company: z.string().nullish(),
  location: z.string().nullish(),
  blog: z.string().nullish(),
  twitter_username: z.string().nullish(),
  email: z.string().nullish(),
  hireable: z.boolean().nullish(),
  type: z.string().default('User'),
  public_repos: z.number(),
  public_gists: z.number().default(0),
  followers: z.number(),
  following: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  html_url: z.string(),
});

export const githubRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullish(),
  html_url: z.string(),
  language: z.string().nullish(),
  stargazers_count: z.number().default(0),
  forks_count: z.number().default(0),
  watchers_count: z.number().default(0),
  open_issues_count: z.number().default(0),
  fork: z.boolean().default(false),
  archived: z.boolean().default(false),
  topics: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string().nullish(),
});

export const githubRepoListSchema = z.array(githubRepoSchema);

export type GithubUser = z.infer<typeof githubUserSchema>;
export type GithubRepo = z.infer<typeof githubRepoSchema>;
