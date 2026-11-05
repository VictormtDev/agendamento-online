import { beforeEach, describe, expect, it } from 'vitest';
import { GetAvailableSlots } from '../../../../src/application/use-cases/get-available-slots.js';
import type { Service } from '../../../../src/domain/entities/service.js';
import type { User } from '../../../../src/domain/entities/user.js';
import { ProviderNotFoundError } from '../../../../src/domain/errors/provider-not-found-error.js';
import { ServiceNotFoundError } from '../../../../src/domain/errors/service-not-found-error.js';
import { FakeClock } from '../../../fakes/fake-clock.js';
import { InMemoryAvailabilityRepository } from '../../../in-memory/in-memory-availability-repository.js';
import { InMemoryServiceRepository } from '../../../in-memory/in-memory-service-repository.js';
import { InMemoryTimeOffRepository } from '../../../in-memory/in-memory-time-off-repository.js';
import { InMemoryUserRepository } from '../../../in-memory/in-memory-user-repository.js';

const THURSDAY = '2026-11-05';

describe('GetAvailableSlots', () => {
  let userRepository: InMemoryUserRepository;
  let serviceRepository: InMemoryServiceRepository;
  let timeOffRepository: InMemoryTimeOffRepository;
  let getAvailableSlots: GetAvailableSlots;
  let provider: User;
  let service: Service;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    serviceRepository = new InMemoryServiceRepository();
    timeOffRepository = new InMemoryTimeOffRepository();
    const availabilityRepository = new InMemoryAvailabilityRepository();
    getAvailableSlots = new GetAvailableSlots(
      userRepository,
      serviceRepository,
      availabilityRepository,
      timeOffRepository,
      new FakeClock(new Date('2026-11-04T12:00:00.000Z')),
    );

    provider = await userRepository.create({
      name: 'Bruno Lima',
      email: 'bruno@example.com',
      passwordHash: 'hashed:secret123',
      role: 'PROVIDER',
      timezone: 'America/Sao_Paulo',
    });
    service = await serviceRepository.create({
      providerId: provider.id,
      name: 'Corte',
      durationMinutes: 60,
      priceCents: 5000,
    });
    await availabilityRepository.replaceForProvider(provider.id, [
      { weekday: 4, startTime: '09:00', endTime: '11:00' },
    ]);
  });

  function execute(overrides: Partial<{ providerId: string; serviceId: string }> = {}) {
    return getAvailableSlots.execute({
      providerId: provider.id,
      serviceId: service.id,
      date: THURSDAY,
      ...overrides,
    });
  }

  it('should return the slots in UTC along with the provider timezone', async () => {
    const output = await execute();

    expect(output.timezone).toBe('America/Sao_Paulo');
    expect(output.slots.map((slot) => slot.start.toISOString())).toEqual([
      '2026-11-05T12:00:00.000Z',
      '2026-11-05T12:15:00.000Z',
      '2026-11-05T12:30:00.000Z',
      '2026-11-05T12:45:00.000Z',
      '2026-11-05T13:00:00.000Z',
    ]);
  });

  it('should not offer slots during a time off', async () => {
    await timeOffRepository.create({
      providerId: provider.id,
      startsAt: new Date('2026-11-05T13:00:00.000Z'),
      endsAt: new Date('2026-11-06T00:00:00.000Z'),
      reason: null,
    });

    const { slots } = await execute();

    expect(slots.map((slot) => slot.start.toISOString())).toEqual(['2026-11-05T12:00:00.000Z']);
  });

  it('should ignore time offs of other providers', async () => {
    await timeOffRepository.create({
      providerId: 'another-provider',
      startsAt: new Date('2026-11-05T00:00:00.000Z'),
      endsAt: new Date('2026-11-06T00:00:00.000Z'),
      reason: null,
    });

    const { slots } = await execute();

    expect(slots).toHaveLength(5);
  });

  it('should fail for an unknown provider', async () => {
    await expect(execute({ providerId: 'missing' })).rejects.toBeInstanceOf(ProviderNotFoundError);
  });

  it('should treat a client id as an unknown provider', async () => {
    const client = await userRepository.create({
      name: 'Carla Dias',
      email: 'carla@example.com',
      passwordHash: 'hashed:secret123',
      role: 'CLIENT',
      timezone: 'America/Sao_Paulo',
    });

    await expect(execute({ providerId: client.id })).rejects.toBeInstanceOf(ProviderNotFoundError);
  });

  it('should not offer slots for an inactive service', async () => {
    await serviceRepository.update(service.id, { active: false });

    await expect(execute()).rejects.toBeInstanceOf(ServiceNotFoundError);
  });

  it('should not offer slots for a service of another provider', async () => {
    const otherService = await serviceRepository.create({
      providerId: 'another-provider',
      name: 'Massagem',
      durationMinutes: 60,
      priceCents: 9000,
    });

    await expect(execute({ serviceId: otherService.id })).rejects.toBeInstanceOf(
      ServiceNotFoundError,
    );
  });
});
