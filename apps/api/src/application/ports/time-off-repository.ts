import type { TimeOff } from '../../domain/entities/time-off.js';
import type { TimeInterval } from '../../domain/services/calculate-available-slots.js';

export type CreateTimeOffData = Pick<TimeOff, 'providerId' | 'startsAt' | 'endsAt' | 'reason'>;

export interface TimeOffRepository {
  /** Returns null both when the time off does not exist and when it belongs to another provider. */
  findByIdAndProvider(id: string, providerId: string): Promise<TimeOff | null>;
  /** Time offs of the provider that intersect the interval; merely touching it does not count. */
  findOverlapping(providerId: string, interval: TimeInterval): Promise<TimeOff[]>;
  create(data: CreateTimeOffData): Promise<TimeOff>;
  delete(id: string): Promise<void>;
}
