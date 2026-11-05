import type {
  CreateTimeOffData,
  TimeOffRepository,
} from '../../application/ports/time-off-repository.js';
import type { TimeOff } from '../../domain/entities/time-off.js';
import type { PrismaClient } from './generated/prisma/client.js';

export class PrismaTimeOffRepository implements TimeOffRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByIdAndProvider(id: string, providerId: string): Promise<TimeOff | null> {
    return this.prisma.timeOff.findFirst({ where: { id, providerId } });
  }

  create(data: CreateTimeOffData): Promise<TimeOff> {
    return this.prisma.timeOff.create({ data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.timeOff.delete({ where: { id } });
  }
}
