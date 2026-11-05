import { randomUUID } from 'node:crypto';
import type {
  CreateServiceData,
  ServiceChanges,
  ServiceRepository,
} from '../../src/application/ports/service-repository.js';
import type { Service } from '../../src/domain/entities/service.js';

export class InMemoryServiceRepository implements ServiceRepository {
  readonly services: Service[] = [];

  findByIdAndProvider(id: string, providerId: string): Promise<Service | null> {
    const service = this.services.find((item) => item.id === id && item.providerId === providerId);
    return Promise.resolve(service ?? null);
  }

  create(data: CreateServiceData): Promise<Service> {
    const service: Service = { id: randomUUID(), active: true, createdAt: new Date(), ...data };
    this.services.push(service);
    return Promise.resolve(service);
  }

  update(id: string, changes: ServiceChanges): Promise<Service> {
    const service = this.services.find((item) => item.id === id);
    if (!service) {
      return Promise.reject(new Error(`Service ${id} not found`));
    }
    Object.assign(service, changes);
    return Promise.resolve(service);
  }
}
