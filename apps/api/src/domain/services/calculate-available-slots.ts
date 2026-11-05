import { TZDate } from '@date-fns/tz';
import { addDays, addHours, addMinutes, areIntervalsOverlapping, format } from 'date-fns';
import type { AvailabilityWindow } from '../entities/availability.js';
import {
  MAX_BOOKING_WINDOW_DAYS,
  MIN_BOOKING_NOTICE_HOURS,
  SLOT_INTERVAL_MINUTES,
} from '../scheduling-rules.js';

/** A half-open UTC interval: `end` is exclusive, so back-to-back intervals do not overlap. */
export interface TimeInterval {
  start: Date;
  end: Date;
}

export interface SlotQuery {
  /** Calendar day "YYYY-MM-DD" in the provider timezone. */
  date: string;
  timezone: string;
  serviceDurationMinutes: number;
  availability: readonly AvailabilityWindow[];
  /** Anything that makes time unbookable: time offs and, later, scheduled appointments. */
  blocked: readonly TimeInterval[];
  now: Date;
}

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

interface CalendarDate {
  year: number;
  monthIndex: number;
  day: number;
}

function parseCalendarDate(date: string): CalendarDate {
  const match = CALENDAR_DATE_PATTERN.exec(date);
  if (!match) {
    // Callers validate the format at the edge; reaching this is a programming error.
    throw new Error(`Invalid calendar date: ${date}`);
  }
  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  return { year, monthIndex: month - 1, day };
}

function atLocalTime(date: CalendarDate, time: string, timezone: string): TZDate {
  const [hours, minutes] = time.split(':').map(Number) as [number, number];
  return new TZDate(date.year, date.monthIndex, date.day, hours, minutes, timezone);
}

// 09:00-12:00 plus 12:00-14:00 is one continuous stretch, so a one-hour service
// must be able to start at 11:30. Assumes windows of a single weekday, without overlaps.
function mergeTouchingWindows(windows: readonly AvailabilityWindow[]): AvailabilityWindow[] {
  const sorted = [...windows].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const merged: AvailabilityWindow[] = [];
  for (const window of sorted) {
    const last = merged.at(-1);
    if (last?.endTime === window.startTime) {
      last.endTime = window.endTime;
    } else {
      merged.push({ ...window });
    }
  }
  return merged;
}

/** The calendar day "YYYY-MM-DD" an instant falls on, as seen in the given timezone. */
export function toCalendarDate(instant: Date, timezone: string): string {
  return format(new TZDate(instant, timezone), 'yyyy-MM-dd');
}

/** The UTC interval covering the whole calendar day in the given timezone (23 to 25 hours long). */
export function getDayInterval(date: string, timezone: string): TimeInterval {
  const { year, monthIndex, day } = parseCalendarDate(date);
  return {
    start: new Date(new TZDate(year, monthIndex, day, timezone).getTime()),
    end: new Date(new TZDate(year, monthIndex, day + 1, timezone).getTime()),
  };
}

/**
 * Lists the UTC start of every bookable slot of a service on a given day.
 *
 * Window times are local to the provider, so they are converted with the provider
 * timezone; from then on everything runs on absolute instants. That is what keeps
 * daylight saving days correct: a 09:00-18:00 window is still 9 real hours, and a
 * window crossing the skipped hour simply has fewer slots.
 */
export function calculateAvailableSlots(query: SlotQuery): TimeInterval[] {
  const date = parseCalendarDate(query.date);
  const weekday = new TZDate(date.year, date.monthIndex, date.day, query.timezone).getDay();
  const earliestStart = addHours(query.now, MIN_BOOKING_NOTICE_HOURS);
  const latestStart = addDays(query.now, MAX_BOOKING_WINDOW_DAYS);

  const slots: TimeInterval[] = [];
  const windows = mergeTouchingWindows(
    query.availability.filter((item) => item.weekday === weekday),
  );
  for (const window of windows) {
    const windowEnd = atLocalTime(date, window.endTime, query.timezone);
    let start: Date = atLocalTime(date, window.startTime, query.timezone);

    while (addMinutes(start, query.serviceDurationMinutes) <= windowEnd) {
      const slot = { start, end: addMinutes(start, query.serviceDurationMinutes) };
      const isBookable =
        slot.start >= earliestStart &&
        slot.start <= latestStart &&
        !query.blocked.some((interval) => areIntervalsOverlapping(slot, interval));
      if (isBookable) {
        slots.push({ start: new Date(slot.start.getTime()), end: new Date(slot.end.getTime()) });
      }
      start = addMinutes(start, SLOT_INTERVAL_MINUTES);
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}
