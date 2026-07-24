import {
  BookMarked,
  GitFork,
  Languages,
  Star,
  UserRound,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatNumber } from '@/lib/format';
import type { Profile, Stats } from '@/lib/schemas';

/**
 * Seis números sueltos no son un gráfico: cada uno se lee de un vistazo y compararlos
 * entre sí no significa nada. La forma correcta es una fila de tarjetas, no un gráfico
 * de barras agrupadas.
 */
export function StatsGrid({ profile, stats }: { profile: Profile; stats: Stats }) {
  const tiles: { label: string; value: number; hint?: string; icon: ReactNode }[] = [
    {
      label: 'Repositorios',
      value: profile.publicRepos,
      hint: stats.forkedRepos > 0 ? `${stats.forkedRepos} son forks` : undefined,
      icon: <BookMarked className="size-4" aria-hidden />,
    },
    {
      label: 'Seguidores',
      value: profile.followers,
      icon: <Users className="size-4" aria-hidden />,
    },
    {
      label: 'Siguiendo',
      value: profile.following,
      icon: <UserRound className="size-4" aria-hidden />,
    },
    {
      label: 'Estrellas',
      value: stats.totalStars,
      hint: stats.mostStarredRepo
        ? `Top: ${stats.mostStarredRepo.name}`
        : undefined,
      icon: <Star className="size-4" aria-hidden />,
    },
    {
      label: 'Forks recibidos',
      value: stats.totalForks,
      icon: <GitFork className="size-4" aria-hidden />,
    },
    {
      label: 'Lenguajes',
      value: stats.languagesCount,
      hint: `${stats.accountAgeYears} años en GitHub`,
      icon: <Languages className="size-4" aria-hidden />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <CardContent className="space-y-1 px-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {tile.icon}
              <span className="text-xs font-medium">{tile.label}</span>
            </div>

            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {formatNumber(tile.value)}
            </p>

            {tile.hint ? (
              <p className="truncate text-xs text-muted-foreground" title={tile.hint}>
                {tile.hint}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
