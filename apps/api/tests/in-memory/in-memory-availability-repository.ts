import { randomUUID } from 'node:crypto';
import type { AvailabilityRepository } from '../../src/application/ports/availability-repository.js';
import type { Availability, AvailabilityWindow } from '../../src/domain/entities/availability.js';

export class InMemoryAvailabilityRepository implements AvailabilityRepository {
  items: Availability[] = [];

  findByProvider(providerId: string): Promise<Availability[]> {
    return Promise.resolve(this.items.filter((item) => item.providerId === providerId));
  }

  replaceForProvider(
    providerId: string,
    windows: readonly AvailabilityWindow[],
  ): Promise<Availability[]> {
    const others = this.items.filter((item) => item.providerId !== providerId);
    const saved = windows
      .map((window) => ({ id: randomUUID(), providerId, ...window }))
      .sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime));
    this.items = [...others, ...saved];
    return Promise.resolve(saved);
  }
}
