'use client';

import { useState } from 'react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { Code2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import type { LanguageSlice } from '@/lib/schemas';
import { ChartEmptyState } from './chart-empty-state';

/**
 * Los ocho slots categóricos se asignan en orden fijo, nunca cíclicamente: el orden
 * está elegido para que cada par contiguo siga siendo distinguible con daltonismo.
 * "Otros" no es una identidad sino un resto, así que va en gris y fuera de la secuencia.
 */
const SERIES_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
];
const OTHER_COLOR = 'var(--chart-other)';

export function LanguagesChart({ languages }: { languages: LanguageSlice[] }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const series = languages.map((slice, index) => ({
    // Clave sintética: los nombres reales ("Jupyter Notebook") llevan espacios y se
    // usan para generar custom properties CSS, donde un espacio rompe la declaración.
    key: `lang-${index}`,
    ...slice,
    color: slice.name === 'Otros' ? OTHER_COLOR : SERIES_COLORS[index % SERIES_COLORS.length],
  }));

  const config: ChartConfig = Object.fromEntries(
    series.map((item) => [item.key, { label: item.name, color: item.color }]),
  );

  const row = Object.fromEntries(series.map((item) => [item.key, item.percentage]));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Distribución de lenguajes</CardTitle>
        <CardDescription>
          Reparto de los repositorios propios según su lenguaje principal.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5">
        {series.length === 0 ? (
          <ChartEmptyState icon={<Code2 className="size-7" aria-hidden />}>
            GitHub todavía no detectó ningún lenguaje en los repositorios públicos de esta
            cuenta.
          </ChartEmptyState>
        ) : (
          <>
            <ChartContainer config={config} className="aspect-auto h-14 w-full">
              <BarChart
                accessibilityLayer
                layout="vertical"
                data={[row]}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                barSize={24}
              >
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" hide />

                <ChartTooltip
                  cursor={false}
                  content={({ payload }) => {
                    const item = payload?.find((entry) => entry.dataKey === activeKey);
                    const slice = series.find((entry) => entry.key === item?.dataKey);
                    if (!slice) return null;

                    return (
                      <div className="rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: slice.color }}
                          />
                          <span className="font-medium">{slice.name}</span>
                        </div>
                        <p className="mt-1 text-muted-foreground">
                          {slice.count} {slice.count === 1 ? 'repositorio' : 'repositorios'} ·{' '}
                          {slice.percentage}%
                        </p>
                      </div>
                    );
                  }}
                />

                {series.map((item, index) => (
                  <Bar
                    key={item.key}
                    dataKey={item.key}
                    stackId="languages"
                    fill={item.color}
                    // El separador entre segmentos es un hueco de 2px del color de la
                    // superficie, no un borde: la línea sería tinta que no es dato.
                    stroke="var(--card)"
                    strokeWidth={2}
                    radius={endRadius(index, series.length)}
                    onMouseEnter={() => setActiveKey(item.key)}
                    onMouseLeave={() => setActiveKey(null)}
                  />
                ))}
              </BarChart>
            </ChartContainer>

            {/* La leyenda lleva el valor como texto: el color nunca es el único canal
                de identidad, y en modo claro algunos matices no llegan a 3:1. */}
            <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {series.map((item) => (
                <li key={item.key} className="flex items-center gap-2.5 text-sm">
                  <span
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: item.color }}
                    aria-hidden
                  />
                  <span className="truncate font-medium">{item.name}</span>
                  <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
                    {item.count} · {item.percentage}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Solo los extremos de la barra se redondean; las uniones interiores quedan a escuadra. */
function endRadius(index: number, total: number): [number, number, number, number] {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  // Orden de Recharts: [sup. izq., sup. der., inf. der., inf. izq.].
  return [isFirst ? 4 : 0, isLast ? 4 : 0, isLast ? 4 : 0, isFirst ? 4 : 0];
}
