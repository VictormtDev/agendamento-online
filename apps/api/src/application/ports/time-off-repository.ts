import type { TimeOff } from '../../domain/entities/time-off.js';

export type CreateTimeOffData = Pick<TimeOff, 'providerId' | 'startsAt' | 'endsAt' | 'reason'>;

export interface TimeOffRepository {
  /** Returns null both when the time off does not exist and when it belongs to another provider. */
  findByIdAndProvider(id: string, providerId: string): Promise<TimeOff | null>;
  create(data: CreateTimeOffData): Promise<TimeOff>;
  delete(id: string): Promise<void>;
}
