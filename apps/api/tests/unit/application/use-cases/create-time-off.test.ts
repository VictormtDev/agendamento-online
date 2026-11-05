import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTimeOff } from '../../../../src/application/use-cases/create-time-off.js';
import { InvalidTimeOffPeriodError } from '../../../../src/domain/errors/invalid-time-off-period-error.js';
import { FakeClock } from '../../../fakes/fake-clock.js';
import { InMemoryTimeOffRepository } from '../../../in-memory/in-memory-time-off-repository.js';

describe('CreateTimeOff', () => {
  let timeOffRepository: InMemoryTimeOffRepository;
  let createTimeOff: CreateTimeOff;

  beforeEach(() => {
    timeOffRepository = new InMemoryTimeOffRepository();
    createTimeOff = new CreateTimeOff(
      timeOffRepository,
      new FakeClock(new Date('2026-11-04T12:00:00.000Z')),
    );
  });

  it('should create a time off in the future', async () => {
    const timeOff = await createTimeOff.execute({
      providerId: 'provider-1',
      startsAt: new Date('2026-12-20T00:00:00.000Z'),
      endsAt: new Date('2027-01-05T00:00:00.000Z'),
      reason: 'Férias',
    });

    expect(timeOff).toMatchObject({ providerId: 'provider-1', reason: 'Férias' });
    expect(timeOffRepository.items).toHaveLength(1);
  });

  it('should not allow a time off that has already ended', async () => {
    await expect(
      createTimeOff.execute({
        providerId: 'provider-1',
        startsAt: new Date('2026-11-01T00:00:00.000Z'),
        endsAt: new Date('2026-11-02T00:00:00.000Z'),
        reason: null,
      }),
    ).rejects.toBeInstanceOf(InvalidTimeOffPeriodError);
    expect(timeOffRepository.items).toHaveLength(0);
  });

  it('should not allow a time off that ends before it starts', async () => {
    await expect(
      createTimeOff.execute({
        providerId: 'provider-1',
        startsAt: new Date('2026-12-10T00:00:00.000Z'),
        endsAt: new Date('2026-12-09T00:00:00.000Z'),
        reason: null,
      }),
    ).rejects.toBeInstanceOf(InvalidTimeOffPeriodError);
  });

  it('should allow overlapping time offs', async () => {
    const period = {
      providerId: 'provider-1',
      startsAt: new Date('2026-12-20T00:00:00.000Z'),
      endsAt: new Date('2026-12-25T00:00:00.000Z'),
      reason: null,
    };

    await createTimeOff.execute(period);
    await createTimeOff.execute(period);

    expect(timeOffRepository.items).toHaveLength(2);
  });
});
