import { describe, expect, it } from 'vitest';
import { GetAvailability } from '../../../../src/application/use-cases/get-availability.js';
import { InMemoryAvailabilityRepository } from '../../../in-memory/in-memory-availability-repository.js';

describe('GetAvailability', () => {
  it('should return only the grid of the provider, by weekday and start time', async () => {
    const availabilityRepository = new InMemoryAvailabilityRepository();
    await availabilityRepository.replaceForProvider('provider-1', [
      { weekday: 3, startTime: '14:00', endTime: '18:00' },
      { weekday: 1, startTime: '09:00', endTime: '12:00' },
      { weekday: 3, startTime: '08:00', endTime: '12:00' },
    ]);
    await availabilityRepository.replaceForProvider('provider-2', [
      { weekday: 0, startTime: '09:00', endTime: '10:00' },
    ]);

    const grid = await new GetAvailability(availabilityRepository).execute({
      providerId: 'provider-1',
    });

    expect(grid.map(({ weekday, startTime }) => `${String(weekday)} ${startTime}`)).toEqual([
      '1 09:00',
      '3 08:00',
      '3 14:00',
    ]);
  });
});
