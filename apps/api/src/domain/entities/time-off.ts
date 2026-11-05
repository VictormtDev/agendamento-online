export const MAX_TIME_OFF_REASON_LENGTH = 200;

/** A one-off block in the agenda (vacation, day off), stored in UTC. */
export interface TimeOff {
  id: string;
  providerId: string;
  startsAt: Date;
  endsAt: Date;
  reason: string | null;
  createdAt: Date;
}

// A time off already in progress is still useful (it blocks the rest of it), so
// only its end has to be in the future.
export function isValidTimeOffPeriod(startsAt: Date, endsAt: Date, now: Date): boolean {
  return endsAt > startsAt && endsAt > now;
}
