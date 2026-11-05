import { SLOT_INTERVAL_MINUTES } from '../scheduling-rules.js';

// Durations off the slot grid would leave unbookable gaps in the agenda.
export const MIN_SERVICE_DURATION_MINUTES = SLOT_INTERVAL_MINUTES;
export const MAX_SERVICE_DURATION_MINUTES = 8 * 60;
// R$ 100.000,00: well above any real service, and far from the 32-bit integer limit of the column.
export const MAX_SERVICE_PRICE_CENTS = 10_000_000;

export interface Service {
  id: string;
  providerId: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  active: boolean;
  createdAt: Date;
}

export function isValidServiceDuration(minutes: number): boolean {
  return (
    Number.isInteger(minutes) &&
    minutes >= MIN_SERVICE_DURATION_MINUTES &&
    minutes <= MAX_SERVICE_DURATION_MINUTES &&
    minutes % SLOT_INTERVAL_MINUTES === 0
  );
}
