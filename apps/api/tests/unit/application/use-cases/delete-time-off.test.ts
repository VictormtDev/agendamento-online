import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteTimeOff } from '../../../../src/application/use-cases/delete-time-off.js';
import type { TimeOff } from '../../../../src/domain/entities/time-off.js';
import { TimeOffNotFoundError } from '../../../../src/domain/errors/time-off-not-found-error.js';
import { InMemoryTimeOffRepository } from '../../../in-memory/in-memory-time-off-repository.js';

describe('DeleteTimeOff', () => {
  let timeOffRepository: InMemoryTimeOffRepository;
  let deleteTimeOff: DeleteTimeOff;
  let timeOff: TimeOff;

  beforeEach(async () => {
    timeOffRepository = new InMemoryTimeOffRepository();
    deleteTimeOff = new DeleteTimeOff(timeOffRepository);
    timeOff = await timeOffRepository.create({
      providerId: 'provider-1',
      startsAt: new Date('2026-12-20T00:00:00.000Z'),
      endsAt: new Date('2027-01-05T00:00:00.000Z'),
      reason: null,
    });
  });

  it('should remove the time off', async () => {
    await deleteTimeOff.execute({ providerId: 'provider-1', timeOffId: timeOff.id });

    expect(timeOffRepository.items).toHaveLength(0);
  });

  it('should treat another provider time off as not found', async () => {
    await expect(
      deleteTimeOff.execute({ providerId: 'provider-2', timeOffId: timeOff.id }),
    ).rejects.toBeInstanceOf(TimeOffNotFoundError);
    expect(timeOffRepository.items).toHaveLength(1);
  });
});
