import { TZDate } from '@date-fns/tz';
import { addDays, format, startOfWeek } from 'date-fns';

export type AgendaView = 'day' | 'week';

export interface AgendaRange {
  from: Date;
  to: Date;
  /** Calendar dates ("YYYY-MM-DD") covered, in the provider timezone. */
  days: string[];
}

const DAYS_IN_VIEW: Record<AgendaView, number> = { day: 1, week: 7 };

// The agenda starts the week on Monday, as Brazilian calendars do.
const WEEK_STARTS_ON = 1;

function midnight(date: string, timezone: string): TZDate {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return new TZDate(year, month - 1, day, timezone);
}

// TZDate serializes with its offset; the API and the rest of the app use plain UTC instants.
function toUtcDate(date: Date): Date {
  return new Date(date.getTime());
}

/**
 * The instants an agenda view covers, from local midnight to local midnight in the
 * provider timezone. Working on TZDate keeps daylight saving days 23 or 25 hours long.
 */
export function agendaRange(view: AgendaView, date: string, timezone: string): AgendaRange {
  const anchor = midnight(date, timezone);
  const start = view === 'week' ? startOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON }) : anchor;
  const days = Array.from({ length: DAYS_IN_VIEW[view] }, (_, index) =>
    format(addDays(start, index), 'yyyy-MM-dd'),
  );
  return { from: toUtcDate(start), to: toUtcDate(addDays(start, DAYS_IN_VIEW[view])), days };
}

/** The date one view earlier (-1) or later (+1): a day or a week away. */
export function shiftDate(
  view: AgendaView,
  date: string,
  timezone: string,
  direction: -1 | 1,
): string {
  return format(addDays(midnight(date, timezone), DAYS_IN_VIEW[view] * direction), 'yyyy-MM-dd');
}

/** The calendar date of an instant in the timezone, to group appointments by day. */
export function calendarDateOf(instant: string, timezone: string): string {
  return format(new TZDate(instant, timezone), 'yyyy-MM-dd');
}

/** The first instant of a calendar date in the timezone. */
export function startOfCalendarDate(date: string, timezone: string): Date {
  return toUtcDate(midnight(date, timezone));
}
