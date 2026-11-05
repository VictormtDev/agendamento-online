import { randomUUID } from 'node:crypto';
import type {
  AppointmentRepository,
  CreateAppointmentData,
} from '../../src/application/ports/appointment-repository.js';
import type { Appointment } from '../../src/domain/entities/appointment.js';
import { SlotUnavailableError } from '../../src/domain/errors/slot-unavailable-error.js';
import type { TimeInterval } from '../../src/domain/services/calculate-available-slots.js';

export class InMemoryAppointmentRepository implements AppointmentRepository {
  readonly items: Appointment[] = [];

  findScheduledOverlapping(providerId: string, interval: TimeInterval): Promise<Appointment[]> {
    return Promise.resolve(
      this.items.filter(
        (item) =>
          item.providerId === providerId &&
          item.status === 'SCHEDULED' &&
          item.startsAt < interval.end &&
          item.endsAt > interval.start,
      ),
    );
  }

  // Mirrors the exclusion constraint of the real database, as promised by the port contract.
  create(data: CreateAppointmentData): Promise<Appointment> {
    const overlaps = this.items.some(
      (item) =>
        item.providerId === data.providerId &&
        item.status === 'SCHEDULED' &&
        item.startsAt < data.endsAt &&
        item.endsAt > data.startsAt,
    );
    if (overlaps) {
      return Promise.reject(new SlotUnavailableError());
    }
    const appointment: Appointment = {
      id: randomUUID(),
      status: 'SCHEDULED',
      canceledAt: null,
      createdAt: new Date(),
      ...data,
    };
    this.items.push(appointment);
    return Promise.resolve(appointment);
  }
}
