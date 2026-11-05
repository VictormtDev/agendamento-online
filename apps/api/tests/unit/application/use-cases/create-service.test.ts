import { describe, expect, it } from 'vitest';
import { CreateService } from '../../../../src/application/use-cases/create-service.js';
import { InMemoryServiceRepository } from '../../../in-memory/in-memory-service-repository.js';

describe('CreateService', () => {
  it('should create an active service owned by the provider', async () => {
    const serviceRepository = new InMemoryServiceRepository();

    const service = await new CreateService(serviceRepository).execute({
      providerId: 'provider-1',
      name: 'Corte de cabelo',
      durationMinutes: 30,
      priceCents: 5000,
    });

    expect(service).toEqual({
      id: expect.any(String),
      providerId: 'provider-1',
      name: 'Corte de cabelo',
      durationMinutes: 30,
      priceCents: 5000,
      active: true,
      createdAt: expect.any(Date),
    });
    expect(serviceRepository.services).toHaveLength(1);
  });
});
