import type { Availability, AvailabilityWindow } from '../../domain/entities/availability.js';

export interface AvailabilityRepository {
  /** Ordered by weekday and start time. */
  findByProvider(providerId: string): Promise<Availability[]>;
  /**
   * Atomically swaps the whole weekly grid of the provider: either every window is
   * saved or none is. Returns the saved grid ordered by weekday and start time.
   */
  replaceForProvider(
    providerId: string,
    windows: readonly AvailabilityWindow[],
  ): Promise<Availability[]>;
}
