import {
  buildLanguages,
  buildReposPerYear,
  buildStats,
  buildTopRepos,
} from './profile.mapper';
import type { GithubRepo, GithubUser } from './schemas/github.schema';

const baseRepo: GithubRepo = {
  id: 1,
  name: 'repo',
  full_name: 'user/repo',
  description: null,
  html_url: 'https://github.com/user/repo',
  language: 'TypeScript',
  stargazers_count: 0,
  forks_count: 0,
  watchers_count: 0,
  open_issues_count: 0,
  fork: false,
  archived: false,
  topics: [],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  pushed_at: '2023-01-01T00:00:00Z',
};

const repo = (overrides: Partial<GithubRepo>): GithubRepo => ({ ...baseRepo, ...overrides });

const user: GithubUser = {
  login: 'user',
  name: 'User',
  avatar_url: 'https://avatars.githubusercontent.com/u/1',
  bio: null,
  company: null,
  location: null,
  blog: null,
  twitter_username: null,
  email: null,
  hireable: null,
  type: 'User',
  public_repos: 3,
  public_gists: 0,
  followers: 10,
  following: 5,
  created_at: '2020-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  html_url: 'https://github.com/user',
};

describe('profile.mapper', () => {
  describe('buildStats', () => {
    it('suma métricas ignorando los forks', () => {
      const stats = buildStats(user, [
        repo({ id: 1, stargazers_count: 10, forks_count: 2 }),
        repo({ id: 2, stargazers_count: 5, forks_count: 1 }),
        repo({ id: 3, stargazers_count: 999, forks_count: 99, fork: true }),
      ]);

      expect(stats.totalStars).toBe(15);
      expect(stats.totalForks).toBe(3);
      expect(stats.ownRepos).toBe(2);
      expect(stats.forkedRepos).toBe(1);
      expect(stats.mostStarredRepo?.stars).toBe(10);
    });

    it('deja mostStarredRepo en null cuando ningún repo tiene estrellas', () => {
      expect(buildStats(user, [repo({})]).mostStarredRepo).toBeNull();
    });
  });

  describe('buildLanguages', () => {
    it('calcula porcentajes y descarta repos sin lenguaje', () => {
      const languages = buildLanguages([
        repo({ id: 1, language: 'TypeScript' }),
        repo({ id: 2, language: 'TypeScript' }),
        repo({ id: 3, language: 'Go' }),
        repo({ id: 4, language: null }),
      ]);

      expect(languages).toEqual([
        { name: 'TypeScript', count: 2, percentage: 66.7 },
        { name: 'Go', count: 1, percentage: 33.3 },
      ]);
    });

    it('agrupa la cola larga en "Otros"', () => {
      const languages = buildLanguages(
        Array.from({ length: 10 }, (_, index) =>
          repo({ id: index, language: `Lang${index}` }),
        ),
      );

      expect(languages).toHaveLength(9);
      expect(languages.at(-1)).toMatchObject({ name: 'Otros', count: 2 });
    });

    it('devuelve una lista vacía si no hay lenguajes', () => {
      expect(buildLanguages([repo({ language: null })])).toEqual([]);
    });
  });

  describe('buildReposPerYear', () => {
    it('rellena con cero los años sin actividad', () => {
      const buckets = buildReposPerYear([
        repo({ id: 1, created_at: '2020-05-01T00:00:00Z' }),
        repo({ id: 2, created_at: '2022-05-01T00:00:00Z' }),
      ]);

      expect(buckets.slice(0, 3)).toEqual([
        { year: '2020', count: 1 },
        { year: '2021', count: 0 },
        { year: '2022', count: 1 },
      ]);
    });

    it('devuelve una lista vacía cuando no hay repos propios', () => {
      expect(buildReposPerYear([repo({ fork: true })])).toEqual([]);
    });
  });

  describe('buildTopRepos', () => {
    it('ordena por estrellas y limita a 6', () => {
      const top = buildTopRepos(
        Array.from({ length: 8 }, (_, index) =>
          repo({ id: index, name: `repo-${index}`, stargazers_count: index }),
        ),
      );

      expect(top).toHaveLength(6);
      expect(top[0].name).toBe('repo-7');
    });
  });
});
