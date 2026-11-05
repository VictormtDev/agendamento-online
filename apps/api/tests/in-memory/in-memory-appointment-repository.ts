import { randomUUID } from 'node:crypto';
import type {
  AppointmentRepository,
  CreateAppointmentData,
} from '../../src/application/ports/appointment-repository.js';
import type { Appointment } from '../../src/domain/entities/appointment.js';
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

  create(data: CreateAppointmentData): Promise<Appointment> {
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
