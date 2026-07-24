'use client';

import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts';
import { Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { formatNumber } from '@/lib/format';
import type { TopRepo } from '@/lib/schemas';
import { ChartEmptyState } from './chart-empty-state';

/**
 * Una sola serie, un solo color.
 *
 * La tentación es pintar cada barra de un tono distinto según su tamaño, pero eso
 * codificaría dos veces la misma variable (longitud y color) y gastaría el canal de
 * color en información que la barra ya muestra.
 */
const config = {
  stars: { label: 'Estrellas', color: 'var(--chart-1)' },
} satisfies ChartConfig;

export function TopReposChart({ repos }: { repos: TopRepo[] }) {
  const withStars = repos.filter((repo) => repo.stars > 0);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Repositorios más valorados</CardTitle>
        <CardDescription>Repositorios propios ordenados por estrellas.</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {withStars.length === 0 ? (
          <ChartEmptyState icon={<Star className="size-7" aria-hidden />}>
            Ninguno de los repositorios públicos de esta cuenta tiene estrellas todavía.
          </ChartEmptyState>
        ) : (
          <ChartContainer
            config={config}
            className="aspect-auto w-full"
            style={{ height: withStars.length * 44 + 16 }}
          >
            <BarChart
              accessibilityLayer
              layout="vertical"
              data={withStars}
              margin={{ top: 4, right: 52, bottom: 4, left: 4 }}
              barSize={20}
              barCategoryGap={12}
            >
              <XAxis type="number" dataKey="stars" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => {
                      const repo = item.payload as TopRepo;
                      return (
                        <div className="grid gap-1">
                          <span className="font-medium">{repo.name}</span>
                          {repo.description ? (
                            <span className="max-w-56 text-muted-foreground">
                              {repo.description}
                            </span>
                          ) : null}
                          <span className="text-muted-foreground">
                            {formatNumber(Number(value))} ★ · {formatNumber(repo.forks)} forks
                            {repo.language ? ` · ${repo.language}` : ''}
                          </span>
                        </div>
                      );
                    }}
                    hideLabel
                  />
                }
              />

              <Bar dataKey="stars" fill="var(--color-stars)" radius={[0, 4, 4, 0]}>
                {/* El valor va en la punta de la barra: evita depender del eje X,
                    que aquí está oculto por ser ruido. */}
                <LabelList
                  dataKey="stars"
                  position="right"
                  offset={8}
                  className="fill-muted-foreground"
                  fontSize={12}
                  formatter={(value) => formatNumber(Number(value))}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
