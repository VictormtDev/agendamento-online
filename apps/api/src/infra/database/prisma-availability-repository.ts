import type { AvailabilityRepository } from '../../application/ports/availability-repository.js';
import type { Availability, AvailabilityWindow } from '../../domain/entities/availability.js';
import type { PrismaClient } from './generated/prisma/client.js';

export class PrismaAvailabilityRepository implements AvailabilityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByProvider(providerId: string): Promise<Availability[]> {
    return this.prisma.availability.findMany({ where: { providerId } });
  }

  async replaceForProvider(
    providerId: string,
    windows: readonly AvailabilityWindow[],
  ): Promise<Availability[]> {
    // Without the transaction, a failure between both statements would leave the
    // provider with no grid at all.
    await this.prisma.$transaction([
      this.prisma.availability.deleteMany({ where: { providerId } }),
      this.prisma.availability.createMany({
        data: windows.map((window) => ({ ...window, providerId })),
      }),
    ]);
    return this.prisma.availability.findMany({
      where: { providerId },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
  }
}
