import { randomUUID } from 'node:crypto';
import type {
  CreateTimeOffData,
  TimeOffRepository,
} from '../../src/application/ports/time-off-repository.js';
import type { TimeOff } from '../../src/domain/entities/time-off.js';

export class InMemoryTimeOffRepository implements TimeOffRepository {
  items: TimeOff[] = [];

  findByIdAndProvider(id: string, providerId: string): Promise<TimeOff | null> {
    const timeOff = this.items.find((item) => item.id === id && item.providerId === providerId);
    return Promise.resolve(timeOff ?? null);
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
