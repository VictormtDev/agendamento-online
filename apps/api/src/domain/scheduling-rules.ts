// Rules shared by services, availability and (later) slot calculation. Keeping them
// in one place means changing the slot grid can never leave one of them behind.

/** Slots are offered every 15 minutes; durations and opening hours follow the same grid. */
export const SLOT_INTERVAL_MINUTES = 15;
