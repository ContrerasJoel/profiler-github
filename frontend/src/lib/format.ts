const compactFormatter = new Intl.NumberFormat('es', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const plainFormatter = new Intl.NumberFormat('es');

/** Compacta solo a partir de 10.000: por debajo, el número exacto se lee igual de rápido. */
export function formatNumber(value: number): string {
  return value >= 10_000 ? compactFormatter.format(value) : plainFormatter.format(value);
}

export function formatMonthYear(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(date);
}

/** "hace 3 días" / "hace 2 meses": más legible que una fecha absoluta para actividad reciente. */
export function formatRelative(iso: string | null): string {
  if (!iso) return '—';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  const relative = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const diffSeconds = (date.getTime() - Date.now()) / 1000;

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];

  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return relative.format(Math.round(diffSeconds / seconds), unit);
    }
  }

  return 'hace unos segundos';
}
