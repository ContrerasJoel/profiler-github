import type { ReactNode } from 'react';

/**
 * Un gráfico sin datos no debe quedar en blanco: el usuario no sabría si está cargando,
 * si falló o si sencillamente no hay nada que mostrar. Este es el caso más habitual en
 * cuentas nuevas (sin estrellas, sin lenguajes detectados).
 */
export function ChartEmptyState({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 px-6 text-center">
      <div className="text-muted-foreground/60">{icon}</div>
      <p className="max-w-xs text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
