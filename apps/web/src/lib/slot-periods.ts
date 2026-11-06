import type { Slot } from '../api/booking';
import { formatTime } from './format';

export type SlotPeriod = 'Manhã' | 'Tarde' | 'Noite';

const AFTERNOON_STARTS_AT_HOUR = 12;
const EVENING_STARTS_AT_HOUR = 18;
const PERIODS: SlotPeriod[] = ['Manhã', 'Tarde', 'Noite'];

// The hour is read in the provider timezone, where the appointment happens.
function periodOf(slot: Slot, timezone: string): SlotPeriod {
  const hour = Number(formatTime(slot.startsAt, timezone).slice(0, 2));
  if (hour < AFTERNOON_STARTS_AT_HOUR) {
    return 'Manhã';
  }
  return hour < EVENING_STARTS_AT_HOUR ? 'Tarde' : 'Noite';
}

/** Slots split into morning, afternoon and evening, in that order, without empty groups. */
export function groupSlotsByPeriod(
  slots: Slot[],
  timezone: string,
): { period: SlotPeriod; slots: Slot[] }[] {
  return PERIODS.map((period) => ({
    period,
    slots: slots.filter((slot) => periodOf(slot, timezone) === period),
  })).filter((group) => group.slots.length > 0);
}
