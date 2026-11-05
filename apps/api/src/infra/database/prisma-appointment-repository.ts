import type {
  AppointmentRepository,
  CreateAppointmentData,
} from '../../application/ports/appointment-repository.js';
import type { Appointment } from '../../domain/entities/appointment.js';
import type { TimeInterval } from '../../domain/services/calculate-available-slots.js';
import type { PrismaClient } from './generated/prisma/client.js';

export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findScheduledOverlapping(providerId: string, interval: TimeInterval): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: {
        providerId,
        status: 'SCHEDULED',
        startsAt: { lt: interval.end },
        endsAt: { gt: interval.start },
      },
    });
  }

  create(data: CreateAppointmentData): Promise<Appointment> {
    return this.prisma.appointment.create({ data });
  }
}
