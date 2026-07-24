import type { GithubRepo, GithubUser } from './schemas/github.schema';
import type {
  LanguageSlice,
  Profile,
  ProfileResponse,
  RecentRepo,
  Stats,
  TopRepo,
  YearBucket,
} from './schemas/profile.schema';

/** Lenguajes distintos que se muestran antes de agrupar la cola en "Otros". */
const MAX_LANGUAGE_SLICES = 8;
const MAX_TOP_REPOS = 6;
const MAX_RECENT_REPOS = 5;

/** GitHub devuelve `null` y `undefined` indistintamente; el contrato solo expone `null`. */
const orNull = <T>(value: T | null | undefined): T | null => value ?? null;

export function mapProfile(user: GithubUser): Profile {
  return {
    login: user.login,
    name: orNull(user.name),
    avatarUrl: user.avatar_url,
    bio: orNull(user.bio),
    company: orNull(user.company),
    location: orNull(user.location),
    // GitHub guarda "" cuando el campo está vacío; lo normalizamos a null.
    blog: user.blog ? user.blog : null,
    twitterUsername: orNull(user.twitter_username),
    email: orNull(user.email),
    hireable: orNull(user.hireable),
    type: user.type,
    publicRepos: user.public_repos,
    publicGists: user.public_gists,
    followers: user.followers,
    following: user.following,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    htmlUrl: user.html_url,
  };
}

/**
 * Las métricas se calculan sobre repositorios *propios*: incluir los forks inflaría
 * los lenguajes y los años con código que el usuario no escribió.
 */
export function buildStats(user: GithubUser, repos: GithubRepo[]): Stats {
  const own = ownRepos(repos);

  const sum = (pick: (repo: GithubRepo) => number): number =>
    own.reduce((total, repo) => total + pick(repo), 0);

  const mostStarred = own.reduce<GithubRepo | null>((best, repo) => {
    if (!best || repo.stargazers_count > best.stargazers_count) return repo;
    return best;
  }, null);

  const ageMs = Date.now() - new Date(user.created_at).getTime();
  const accountAgeYears = Math.round((ageMs / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10;

  return {
    totalStars: sum((repo) => repo.stargazers_count),
    totalForks: sum((repo) => repo.forks_count),
    totalWatchers: sum((repo) => repo.watchers_count),
    totalOpenIssues: sum((repo) => repo.open_issues_count),
    ownRepos: own.length,
    forkedRepos: repos.length - own.length,
    archivedRepos: own.filter((repo) => repo.archived).length,
    languagesCount: new Set(own.map((repo) => repo.language).filter(Boolean)).size,
    accountAgeYears,
    mostStarredRepo:
      mostStarred && mostStarred.stargazers_count > 0
        ? {
            name: mostStarred.name,
            stars: mostStarred.stargazers_count,
            htmlUrl: mostStarred.html_url,
          }
        : null,
  };
}

/**
 * Distribución de lenguajes por repositorio.
 *
 * Usamos el campo `language` (lenguaje dominante) en lugar de `/repos/:owner/:repo/languages`,
 * que daría el desglose por bytes pero costaría una petición *por repositorio*: con 100 repos
 * serían 100 llamadas y el rate limit se agotaría en pocas búsquedas.
 */
export function buildLanguages(repos: GithubRepo[]): LanguageSlice[] {
  const counts = new Map<string, number>();

  for (const repo of ownRepos(repos)) {
    if (!repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }

  const total = [...counts.values()].reduce((acc, count) => acc + count, 0);
  if (total === 0) return [];

  const sorted = [...counts.entries()].sort(
    ([nameA, countA], [nameB, countB]) => countB - countA || nameA.localeCompare(nameB),
  );

  const visible = sorted.slice(0, MAX_LANGUAGE_SLICES);
  const rest = sorted.slice(MAX_LANGUAGE_SLICES);

  const slices: LanguageSlice[] = visible.map(([name, count]) => ({
    name,
    count,
    percentage: toPercentage(count, total),
  }));

  if (rest.length > 0) {
    const restCount = rest.reduce((acc, [, count]) => acc + count, 0);
    slices.push({
      name: 'Otros',
      count: restCount,
      percentage: toPercentage(restCount, total),
    });
  }

  return slices;
}

export function buildTopRepos(repos: GithubRepo[]): TopRepo[] {
  return ownRepos(repos)
    .slice()
    .sort(
      (a, b) =>
        b.stargazers_count - a.stargazers_count ||
        b.forks_count - a.forks_count ||
        a.name.localeCompare(b.name),
    )
    .slice(0, MAX_TOP_REPOS)
    .map((repo) => ({
      name: repo.name,
      description: orNull(repo.description),
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: orNull(repo.language),
      topics: repo.topics,
      htmlUrl: repo.html_url,
      updatedAt: repo.updated_at,
    }));
}

/**
 * Repositorios creados por año, con los años intermedios rellenados en cero: sin eso
 * un usuario inactivo durante 2019-2021 produciría un gráfico de línea que salta esos
 * años y distorsiona la pendiente.
 */
export function buildReposPerYear(repos: GithubRepo[]): YearBucket[] {
  const own = ownRepos(repos);
  if (own.length === 0) return [];

  const counts = new Map<number, number>();

  for (const repo of own) {
    const year = new Date(repo.created_at).getUTCFullYear();
    if (Number.isNaN(year)) continue;
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }

  const years = [...counts.keys()];
  if (years.length === 0) return [];

  const from = Math.min(...years);
  const to = Math.max(Math.max(...years), new Date().getUTCFullYear());

  const buckets: YearBucket[] = [];
  for (let year = from; year <= to; year += 1) {
    buckets.push({ year: String(year), count: counts.get(year) ?? 0 });
  }

  return buckets;
}

export function buildRecentRepos(repos: GithubRepo[]): RecentRepo[] {
  return ownRepos(repos)
    .slice()
    .sort((a, b) => timestamp(b.pushed_at ?? b.updated_at) - timestamp(a.pushed_at ?? a.updated_at))
    .slice(0, MAX_RECENT_REPOS)
    .map((repo) => ({
      name: repo.name,
      description: orNull(repo.description),
      language: orNull(repo.language),
      stars: repo.stargazers_count,
      pushedAt: orNull(repo.pushed_at ?? repo.updated_at),
      htmlUrl: repo.html_url,
    }));
}

export function buildProfileResponse(
  user: GithubUser,
  repos: GithubRepo[],
  meta: ProfileResponse['meta'],
): ProfileResponse {
  return {
    profile: mapProfile(user),
    stats: buildStats(user, repos),
    languages: buildLanguages(repos),
    topRepos: buildTopRepos(repos),
    reposPerYear: buildReposPerYear(repos),
    recentRepos: buildRecentRepos(repos),
    meta,
  };
}

function ownRepos(repos: GithubRepo[]): GithubRepo[] {
  return repos.filter((repo) => !repo.fork);
}

function toPercentage(count: number, total: number): number {
  return Math.round((count / total) * 1000) / 10;
}

function timestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}
