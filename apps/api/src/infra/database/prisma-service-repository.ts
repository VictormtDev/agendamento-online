import type {
  CreateServiceData,
  ServiceChanges,
  ServiceRepository,
} from '../../application/ports/service-repository.js';
import type { Service } from '../../domain/entities/service.js';
import type { PrismaClient } from './generated/prisma/client.js';

export class PrismaServiceRepository implements ServiceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByIdAndProvider(id: string, providerId: string): Promise<Service | null> {
    return this.prisma.service.findFirst({ where: { id, providerId } });
  }

  create(data: CreateServiceData): Promise<Service> {
    return this.prisma.service.create({ data });
  }

  update(id: string, changes: ServiceChanges): Promise<Service> {
    return this.prisma.service.update({ where: { id }, data: changes });
  }
}
