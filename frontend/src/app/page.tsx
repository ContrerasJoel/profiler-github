'use client';

import { useEffect } from 'react';
import { LanguagesChart } from '@/components/charts/languages-chart';
import { ReposPerYearChart } from '@/components/charts/repos-per-year-chart';
import { TopReposChart } from '@/components/charts/top-repos-chart';
import { ErrorState } from '@/components/error-state';
import { GithubMark } from '@/components/github-mark';
import { ProfileCard } from '@/components/profile-card';
import { ProfileSkeleton } from '@/components/profile-skeleton';
import { RepoList } from '@/components/repo-list';
import { SearchBar } from '@/components/search-bar';
import { StatsGrid } from '@/components/stats-grid';
import { ThemeToggle } from '@/components/theme-toggle';
import { API_URL, DEFAULT_USERNAME } from '@/lib/api';
import { useProfileStore } from '@/store/profile-store';

export default function Home() {
  const { data, status, error, username, loadProfile, retry } = useProfileStore();

  // El reto pide que la página muestre datos "al cargar": arrancamos con el perfil
  // por defecto y el buscador queda para explorar cualquier otro.
  useEffect(() => {
    void loadProfile(DEFAULT_USERNAME);
  }, [loadProfile]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <GithubMark className="size-5" />
            <span className="font-semibold tracking-tight">GitHub Profiler</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8">
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-balance text-3xl font-semibold tracking-tight">
              Perfiles de GitHub, con contexto
            </h1>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              Buscá cualquier usuario y mirá sus métricas, lenguajes y actividad. Los datos
              se piden a una API propia en NestJS que agrega y normaliza la respuesta de
              GitHub.
            </p>
          </div>

          <SearchBar />
        </div>

        {status === 'loading' || status === 'idle' ? <ProfileSkeleton /> : null}

        {status === 'error' && error ? (
          <ErrorState error={error} username={username} onRetry={() => void retry()} />
        ) : null}

        {status === 'success' && data ? (
          <div className="space-y-6">
            <ProfileCard profile={data.profile} />
            <StatsGrid profile={data.profile} stats={data.stats} />

            <div className="grid items-start gap-6 lg:grid-cols-2">
              <LanguagesChart languages={data.languages} />
              <ReposPerYearChart data={data.reposPerYear} />
              <TopReposChart repos={data.topRepos} />
              <RepoList repos={data.recentRepos} />
            </div>

            <p className="text-center text-xs text-muted-foreground">
              {data.meta.reposAnalyzed}{' '}
              {data.meta.reposAnalyzed === 1
                ? 'repositorio analizado'
                : 'repositorios analizados'}
              {data.meta.reposTruncated ? ' (limitado a los 300 más activos)' : ''}
              {data.meta.cached ? ' · respuesta servida desde la caché del backend' : ''}
            </p>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>Next.js + NestJS · datos de la API pública de GitHub</p>
          <a
            href={`${API_URL}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Documentación de la API
          </a>
        </div>
      </footer>
    </div>
  );
}
