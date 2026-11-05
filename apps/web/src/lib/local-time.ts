import { TZDate } from '@date-fns/tz';

/**
 * Reads a wall-clock "YYYY-MM-DDTHH:mm" (what a datetime-local input gives) as a time
 * in the timezone, returning the absolute instant. The device timezone plays no part.
 */
export function localDateTimeToInstant(value: string, timezone: string): Date {
  const [date = '', time = ''] = value.split('T');
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return new Date(new TZDate(year, month - 1, day, hours, minutes, timezone).getTime());
}
