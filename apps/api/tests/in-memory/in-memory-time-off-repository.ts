import { randomUUID } from 'node:crypto';
import type {
  CreateTimeOffData,
  TimeOffRepository,
} from '../../src/application/ports/time-off-repository.js';
import type { TimeOff } from '../../src/domain/entities/time-off.js';
import type { TimeInterval } from '../../src/domain/services/calculate-available-slots.js';

export class InMemoryTimeOffRepository implements TimeOffRepository {
  items: TimeOff[] = [];

  findByIdAndProvider(id: string, providerId: string): Promise<TimeOff | null> {
    const timeOff = this.items.find((item) => item.id === id && item.providerId === providerId);
    return Promise.resolve(timeOff ?? null);
  }

  findOverlapping(providerId: string, interval: TimeInterval): Promise<TimeOff[]> {
    return Promise.resolve(
      this.items.filter(
        (item) =>
          item.providerId === providerId &&
          item.startsAt < interval.end &&
          item.endsAt > interval.start,
      ),
    );
  }

  create(data: CreateTimeOffData): Promise<TimeOff> {
    const timeOff: TimeOff = { id: randomUUID(), createdAt: new Date(), ...data };
    this.items.push(timeOff);
    return Promise.resolve(timeOff);
  }

  delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id);
    return Promise.resolve();
  }
}
