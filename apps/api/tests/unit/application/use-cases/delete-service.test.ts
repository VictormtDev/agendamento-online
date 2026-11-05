import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteService } from '../../../../src/application/use-cases/delete-service.js';
import type { Service } from '../../../../src/domain/entities/service.js';
import { ServiceNotFoundError } from '../../../../src/domain/errors/service-not-found-error.js';
import { InMemoryServiceRepository } from '../../../in-memory/in-memory-service-repository.js';

describe('DeleteService', () => {
  let serviceRepository: InMemoryServiceRepository;
  let deleteService: DeleteService;
  let service: Service;

  beforeEach(async () => {
    serviceRepository = new InMemoryServiceRepository();
    deleteService = new DeleteService(serviceRepository);
    service = await serviceRepository.create({
      providerId: 'provider-1',
      name: 'Corte de cabelo',
      durationMinutes: 30,
      priceCents: 5000,
    });
  });

  it('should deactivate the service instead of removing it', async () => {
    await deleteService.execute({ providerId: 'provider-1', serviceId: service.id });

    expect(serviceRepository.services).toEqual([{ ...service, active: false }]);
  });

  it('should be idempotent for an already inactive service', async () => {
    await deleteService.execute({ providerId: 'provider-1', serviceId: service.id });

    await expect(
      deleteService.execute({ providerId: 'provider-1', serviceId: service.id }),
    ).resolves.toBeUndefined();
  });

  it('should treat another provider service as not found', async () => {
    await expect(
      deleteService.execute({ providerId: 'provider-2', serviceId: service.id }),
    ).rejects.toBeInstanceOf(ServiceNotFoundError);
    expect(service.active).toBe(true);
  });
});
