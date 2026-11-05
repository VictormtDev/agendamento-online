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

/** Today's calendar date ("YYYY-MM-DD") in a timezone; en-CA writes dates in ISO order. */
export function todayIn(timezone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

// Times are shown in the provider timezone: that is where the appointment happens,
// whatever the clock of the device showing it.
export function formatTime(instant: string, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(instant));
}

/** E.g. "quinta-feira, 12 de novembro". */
export function formatDayLabel(instant: Date, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(instant);
}

/** E.g. "quinta-feira, 12 de novembro de 2026 às 09:00". */
export function formatDateTime(instant: string, timezone: string): string {
  const date = new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, dateStyle: 'full' }).format(
    new Date(instant),
  );
  return `${date} às ${formatTime(instant, timezone)}`;
}
