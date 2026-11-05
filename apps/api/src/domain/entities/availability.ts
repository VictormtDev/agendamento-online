import { SLOT_INTERVAL_MINUTES } from '../scheduling-rules.js';

// 0 = Sunday ... 6 = Saturday, the same convention as Date#getDay and date-fns.
export const MIN_WEEKDAY = 0;
export const MAX_WEEKDAY = 6;

const TIME_OF_DAY_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/** A weekly opening window, in "HH:mm" interpreted in the provider's timezone. */
export interface AvailabilityWindow {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface Availability extends AvailabilityWindow {
  id: string;
  providerId: string;
}

// Off-grid times like 09:10 would make the first slot of the window unreachable.
export function isValidTimeOfDay(time: string): boolean {
  if (!TIME_OF_DAY_PATTERN.test(time)) {
    return false;
  }
  return Number(time.slice(3)) % SLOT_INTERVAL_MINUTES === 0;
}

// Zero-padded "HH:mm" strings sort in chronological order, so plain string
// comparison is correct here and needs no parsing.
export function isChronologicalWindow(window: AvailabilityWindow): boolean {
  return window.startTime < window.endTime;
}

// Windows that only touch (12:00-14:00 and 14:00-18:00) are fine: the end is exclusive.
export function hasOverlappingWindows(windows: readonly AvailabilityWindow[]): boolean {
  const sorted = [...windows].sort(
    (a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime),
  );
  return sorted.some((window, index) => {
    const previous = sorted[index - 1];
    return previous?.weekday === window.weekday && window.startTime < previous.endTime;
  });
}
