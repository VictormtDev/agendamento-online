import type {
  CreateTimeOffData,
  TimeOffRepository,
} from '../../application/ports/time-off-repository.js';
import type { TimeOff } from '../../domain/entities/time-off.js';
import type { TimeInterval } from '../../domain/services/calculate-available-slots.js';
import type { PrismaClient } from './generated/prisma/client.js';

export class PrismaTimeOffRepository implements TimeOffRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByIdAndProvider(id: string, providerId: string): Promise<TimeOff | null> {
    return this.prisma.timeOff.findFirst({ where: { id, providerId } });
  }

  findOverlapping(providerId: string, interval: TimeInterval): Promise<TimeOff[]> {
    return this.prisma.timeOff.findMany({
      where: { providerId, startsAt: { lt: interval.end }, endsAt: { gt: interval.start } },
    });
  }

  listEndingAfter(providerId: string, instant: Date): Promise<TimeOff[]> {
    return this.prisma.timeOff.findMany({
      where: { providerId, endsAt: { gt: instant } },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
    });
  }

  create(data: CreateTimeOffData): Promise<TimeOff> {
    return this.prisma.timeOff.create({ data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.timeOff.delete({ where: { id } });
  }
}
