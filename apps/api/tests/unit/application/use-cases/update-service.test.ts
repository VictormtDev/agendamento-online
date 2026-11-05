import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateService } from '../../../../src/application/use-cases/update-service.js';
import type { Service } from '../../../../src/domain/entities/service.js';
import { ServiceNotFoundError } from '../../../../src/domain/errors/service-not-found-error.js';
import { InMemoryServiceRepository } from '../../../in-memory/in-memory-service-repository.js';

describe('UpdateService', () => {
  let serviceRepository: InMemoryServiceRepository;
  let updateService: UpdateService;
  let service: Service;

  beforeEach(async () => {
    serviceRepository = new InMemoryServiceRepository();
    updateService = new UpdateService(serviceRepository);
    service = await serviceRepository.create({
      providerId: 'provider-1',
      name: 'Corte de cabelo',
      durationMinutes: 30,
      priceCents: 5000,
    });
  });

  it('should change only the given fields', async () => {
    const updated = await updateService.execute({
      providerId: 'provider-1',
      serviceId: service.id,
      changes: { priceCents: 6000 },
    });

    expect(updated).toMatchObject({
      name: 'Corte de cabelo',
      durationMinutes: 30,
      priceCents: 6000,
    });
  });

  it('should allow reactivating an inactive service', async () => {
    await serviceRepository.update(service.id, { active: false });

    const updated = await updateService.execute({
      providerId: 'provider-1',
      serviceId: service.id,
      changes: { active: true },
    });

    expect(updated.active).toBe(true);
  });

  it('should treat another provider service as not found', async () => {
    await expect(
      updateService.execute({
        providerId: 'provider-2',
        serviceId: service.id,
        changes: { priceCents: 1 },
      }),
    ).rejects.toBeInstanceOf(ServiceNotFoundError);
    expect(service.priceCents).toBe(5000);
  });

  it('should fail when the service does not exist', async () => {
    await expect(
      updateService.execute({ providerId: 'provider-1', serviceId: 'missing', changes: {} }),
    ).rejects.toBeInstanceOf(ServiceNotFoundError);
  });
});
