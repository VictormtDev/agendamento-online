// Rules shared by services, availability, slot calculation and booking. Keeping them
// in one place means changing a rule can never leave one of its users behind.

/** Slots are offered every 15 minutes; durations and opening hours follow the same grid. */
export const SLOT_INTERVAL_MINUTES = 15;

/** Bookings must start at least this long after "now", so the provider can prepare. */
export const MIN_BOOKING_NOTICE_HOURS = 2;

/** Bookings can start at most this far ahead of "now". */
export const MAX_BOOKING_WINDOW_DAYS = 60;

/** Clients can cancel up to this long before the start; providers have no such limit. */
export const CLIENT_CANCELLATION_NOTICE_HOURS = 24;
