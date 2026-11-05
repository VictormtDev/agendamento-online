import type { Appointment } from '../../domain/entities/appointment.js';
import type { TimeInterval } from '../../domain/services/calculate-available-slots.js';

export type CreateAppointmentData = Pick<
  Appointment,
  'providerId' | 'clientId' | 'serviceId' | 'startsAt' | 'endsAt'
>;

export interface AppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  /** SCHEDULED appointments of the provider that intersect the interval; touching does not count. */
  findScheduledOverlapping(providerId: string, interval: TimeInterval): Promise<Appointment[]>;
  /** @throws SlotUnavailableError when it would overlap a SCHEDULED one, even under concurrent inserts. */
  create(data: CreateAppointmentData): Promise<Appointment>;
  cancel(id: string, canceledAt: Date): Promise<Appointment>;
}
