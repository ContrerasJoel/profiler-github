import { Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, formatRelative } from '@/lib/format';
import type { RecentRepo } from '@/lib/schemas';

export function RepoList({ repos }: { repos: RecentRepo[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Actividad reciente</CardTitle>
        <CardDescription>Últimos repositorios propios con cambios.</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {repos.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay repositorios propios públicos que mostrar.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {repos.map((repo) => (
              <li key={repo.name} className="py-3 first:pt-0 last:pb-0">
                <a
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block space-y-1"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium underline-offset-4 group-hover:underline">
                      {repo.name}
                    </span>

                    {repo.stars > 0 ? (
                      <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground">
                        <Star className="size-3.5" aria-hidden />
                        {formatNumber(repo.stars)}
                      </span>
                    ) : null}
                  </div>

                  {repo.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {repo.description}
                    </p>
                  ) : null}

                  <p className="text-xs text-muted-foreground">
                    {repo.language ? `${repo.language} · ` : ''}
                    Actualizado {formatRelative(repo.pushedAt)}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
