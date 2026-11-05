import { beforeEach, describe, expect, it } from 'vitest';
import { ReplaceAvailability } from '../../../../src/application/use-cases/replace-availability.js';
import { InMemoryAvailabilityRepository } from '../../../in-memory/in-memory-availability-repository.js';

describe('ReplaceAvailability', () => {
  let availabilityRepository: InMemoryAvailabilityRepository;
  let replaceAvailability: ReplaceAvailability;

  beforeEach(() => {
    availabilityRepository = new InMemoryAvailabilityRepository();
    replaceAvailability = new ReplaceAvailability(availabilityRepository);
  });

  it('should replace the previous grid instead of appending to it', async () => {
    await replaceAvailability.execute({
      providerId: 'provider-1',
      windows: [{ weekday: 1, startTime: '09:00', endTime: '18:00' }],
    });

    const saved = await replaceAvailability.execute({
      providerId: 'provider-1',
      windows: [{ weekday: 2, startTime: '10:00', endTime: '16:00' }],
    });

    expect(saved).toEqual([
      {
        id: expect.any(String),
        providerId: 'provider-1',
        weekday: 2,
        startTime: '10:00',
        endTime: '16:00',
      },
    ]);
    expect(availabilityRepository.items).toHaveLength(1);
  });

  it('should clear the grid when given no windows', async () => {
    await replaceAvailability.execute({
      providerId: 'provider-1',
      windows: [{ weekday: 1, startTime: '09:00', endTime: '18:00' }],
    });

    await expect(
      replaceAvailability.execute({ providerId: 'provider-1', windows: [] }),
    ).resolves.toEqual([]);
  });

  it('should not touch the grid of other providers', async () => {
    await replaceAvailability.execute({
      providerId: 'provider-2',
      windows: [{ weekday: 1, startTime: '09:00', endTime: '18:00' }],
    });

    await replaceAvailability.execute({ providerId: 'provider-1', windows: [] });

    expect(availabilityRepository.items).toHaveLength(1);
  });
});
