import { shiftDate } from './agenda-range';

export const STRIP_LENGTH_DAYS = 7;

/** The calendar dates ("YYYY-MM-DD") the day strip shows, starting at `start`. */
export function stripDays(start: string, timezone: string): string[] {
  const days = [start];
  while (days.length < STRIP_LENGTH_DAYS) {
    const last = days[days.length - 1] ?? start;
    days.push(shiftDate('day', last, timezone, 1));
  }
  return days;
}
