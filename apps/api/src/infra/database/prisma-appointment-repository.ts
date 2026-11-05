import type {
  AppointmentRepository,
  CreateAppointmentData,
} from '../../application/ports/appointment-repository.js';
import type { Appointment } from '../../domain/entities/appointment.js';
import { SlotUnavailableError } from '../../domain/errors/slot-unavailable-error.js';
import type { TimeInterval } from '../../domain/services/calculate-available-slots.js';
import { Prisma, type PrismaClient } from './generated/prisma/client.js';

const EXCLUSION_VIOLATION = '23P01';
const NO_OVERLAP_CONSTRAINT = 'no_overlapping_appointments';

// Prisma has no dedicated code for exclusion constraints: with a driver adapter it
// reports a generic error and keeps the Postgres one in an untyped `meta`, so it is
// read defensively. Matching the constraint name keeps other failures as real errors.
function isOverlapViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  const cause = (error.meta?.driverAdapterError as { cause?: unknown } | undefined)?.cause;
  if (typeof cause !== 'object' || cause === null) {
    return false;
  }
  const { originalCode, originalMessage } = cause as Record<string, unknown>;
  return (
    originalCode === EXCLUSION_VIOLATION &&
    typeof originalMessage === 'string' &&
    originalMessage.includes(NO_OVERLAP_CONSTRAINT)
  );
}

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

  async create(data: CreateAppointmentData): Promise<Appointment> {
    try {
      return await this.prisma.appointment.create({ data });
    } catch (error) {
      // Two simultaneous bookings can both pass the use case check; the exclusion
      // constraint lets only one in, and the loser gets the same friendly error.
      if (isOverlapViolation(error)) {
        throw new SlotUnavailableError();
      }
      throw error;
    }
  }
}
