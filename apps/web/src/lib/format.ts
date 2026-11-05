const MINUTES_PER_HOUR = 60;

const priceFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Formats an amount in cents, e.g. 4550 → "R$ 45,50". */
export function formatPrice(cents: number): string {
  return priceFormatter.format(cents / 100);
}

/** Formats a duration in minutes, e.g. 90 → "1 h 30 min". */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  if (hours === 0) {
    return `${String(minutes)} min`;
  }
  return minutes === 0 ? `${String(hours)} h` : `${String(hours)} h ${String(minutes)} min`;
}
