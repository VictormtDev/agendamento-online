import { beforeEach, describe, expect, it } from 'vitest';
import { ListUpcomingTimeOffs } from '../../../../src/application/use-cases/list-upcoming-time-offs.js';
import { FakeClock } from '../../../fakes/fake-clock.js';
import { InMemoryTimeOffRepository } from '../../../in-memory/in-memory-time-off-repository.js';

describe('ListUpcomingTimeOffs', () => {
  let timeOffRepository: InMemoryTimeOffRepository;
  let listUpcomingTimeOffs: ListUpcomingTimeOffs;

  function create(startsAt: string, endsAt: string, providerId = 'provider-1') {
    return timeOffRepository.create({
      providerId,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      reason: null,
    });
  }

  beforeEach(() => {
    timeOffRepository = new InMemoryTimeOffRepository();
    // "Now" is 2026-11-04T12:00Z.
    listUpcomingTimeOffs = new ListUpcomingTimeOffs(timeOffRepository, new FakeClock());
  });

  it('should list the ongoing and future time offs by start, leaving past ones out', async () => {
    const future = await create('2026-12-20T00:00:00.000Z', '2027-01-05T00:00:00.000Z');
    await create('2026-10-01T00:00:00.000Z', '2026-10-02T00:00:00.000Z');
    const ongoing = await create('2026-11-04T00:00:00.000Z', '2026-11-05T00:00:00.000Z');

    const timeOffs = await listUpcomingTimeOffs.execute({ providerId: 'provider-1' });

    expect(timeOffs.map((item) => item.id)).toEqual([ongoing.id, future.id]);
  });

  it('should leave out a time off that ended exactly now', async () => {
    await create('2026-11-04T10:00:00.000Z', '2026-11-04T12:00:00.000Z');

    const timeOffs = await listUpcomingTimeOffs.execute({ providerId: 'provider-1' });

    expect(timeOffs).toEqual([]);
  });

  it('should not list time offs of other providers', async () => {
    await create('2026-12-20T00:00:00.000Z', '2027-01-05T00:00:00.000Z', 'provider-2');

    const timeOffs = await listUpcomingTimeOffs.execute({ providerId: 'provider-1' });

    expect(timeOffs).toEqual([]);
  });
});
