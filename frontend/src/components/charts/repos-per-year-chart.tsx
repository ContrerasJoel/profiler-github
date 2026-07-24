'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { CalendarRange } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { YearBucket } from '@/lib/schemas';
import { ChartEmptyState } from './chart-empty-state';

const config = {
  count: { label: 'Repositorios', color: 'var(--chart-1)' },
} satisfies ChartConfig;

export function ReposPerYearChart({ data }: { data: YearBucket[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Repositorios creados por año</CardTitle>
        <CardDescription>
          Actividad de la cuenta a lo largo del tiempo, incluidos los años sin repos nuevos.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {data.length === 0 ? (
          <ChartEmptyState icon={<CalendarRange className="size-7" aria-hidden />}>
            Esta cuenta todavía no tiene repositorios propios públicos.
          </ChartEmptyState>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-[220px] w-full">
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="repos-per-year-fill" x1="0" y1="0" x2="0" y2="1">
                  {/* Relleno como veladura, no como bloque saturado. */}
                  <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} strokeDasharray="0" />
              <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                // Ancho suficiente para valores de dos y tres cifras: por debajo,
                // Recharts recorta la etiqueta en vez de encogerla.
                width={44}
                allowDecimals={false}
              />

              <ChartTooltip
                cursor
                content={<ChartTooltipContent indicator="line" />}
              />

              <Area
                dataKey="count"
                type="monotone"
                stroke="var(--color-count)"
                strokeWidth={2}
                fill="url(#repos-per-year-fill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
