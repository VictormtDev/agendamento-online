import type {
  AppointmentRepository,
  ClientAppointmentsQuery,
  ClientAppointmentView,
  CreateAppointmentData,
  ProviderAppointmentsQuery,
  ProviderAppointmentView,
} from '../../application/ports/appointment-repository.js';
import type { Appointment } from '../../domain/entities/appointment.js';
import { SlotUnavailableError } from '../../domain/errors/slot-unavailable-error.js';
import type { TimeInterval } from '../../domain/services/calculate-available-slots.js';
import { Prisma, type PrismaClient } from './generated/prisma/client.js';

const EXCLUSION_VIOLATION = '23P01';
const NO_OVERLAP_CONSTRAINT = 'no_overlapping_appointments';

const SERVICE_SUMMARY = {
  select: { id: true, name: true, durationMinutes: true, priceCents: true },
} as const;

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

  findById(id: string): Promise<Appointment | null> {
    return this.prisma.appointment.findUnique({ where: { id } });
  }

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

  async listByClient({
    clientId,
    status,
    page,
    perPage,
  }: ClientAppointmentsQuery): Promise<{ items: ClientAppointmentView[]; total: number }> {
    const where = { clientId, ...(status && { status }) };
    // Same filter for both queries inside one transaction, so total matches the page.
    const [items, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        include: {
          service: SERVICE_SUMMARY,
          provider: { select: { id: true, name: true, timezone: true } },
        },
        orderBy: { startsAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.appointment.count({ where }),
    ]);
    return { items, total };
  }

  listByProvider({
    providerId,
    interval,
    status,
  }: ProviderAppointmentsQuery): Promise<ProviderAppointmentView[]> {
    return this.prisma.appointment.findMany({
      where: {
        providerId,
        startsAt: { lt: interval.end },
        endsAt: { gt: interval.start },
        ...(status && { status }),
      },
      include: { service: SERVICE_SUMMARY, client: { select: { id: true, name: true } } },
      orderBy: { startsAt: 'asc' },
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

  cancel(id: string, canceledAt: Date): Promise<Appointment> {
    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELED', canceledAt },
    });
  }
}
