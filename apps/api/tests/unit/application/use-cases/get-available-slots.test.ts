import { beforeEach, describe, expect, it } from 'vitest';
import { GetAvailableSlots } from '../../../../src/application/use-cases/get-available-slots.js';
import { ProviderNotFoundError } from '../../../../src/domain/errors/provider-not-found-error.js';
import { ServiceNotFoundError } from '../../../../src/domain/errors/service-not-found-error.js';
import { createAgendaFixture, FIXTURE_DATE } from '../../../fakes/create-agenda-fixture.js';

describe('GetAvailableSlots', () => {
  let fixture: Awaited<ReturnType<typeof createAgendaFixture>>;
  let getAvailableSlots: GetAvailableSlots;

  beforeEach(async () => {
    fixture = await createAgendaFixture();
    getAvailableSlots = new GetAvailableSlots(fixture.repositories, fixture.clock);
  });

  function execute(overrides: Partial<{ providerId: string; serviceId: string }> = {}) {
    return getAvailableSlots.execute({
      providerId: fixture.provider.id,
      serviceId: fixture.service.id,
      date: FIXTURE_DATE,
      ...overrides,
    });
  }

  async function startsOf(): Promise<string[]> {
    const { slots } = await execute();
    return slots.map((slot) => slot.start.toISOString());
  }

  it('should return the slots in UTC along with the provider timezone', async () => {
    const output = await execute();

    expect(output.timezone).toBe('America/Sao_Paulo');
    await expect(startsOf()).resolves.toEqual([
      '2026-11-05T12:00:00.000Z',
      '2026-11-05T12:15:00.000Z',
      '2026-11-05T12:30:00.000Z',
      '2026-11-05T12:45:00.000Z',
      '2026-11-05T13:00:00.000Z',
    ]);
  });

  it('should not offer slots during a time off', async () => {
    await fixture.repositories.timeOffRepository.create({
      providerId: fixture.provider.id,
      startsAt: new Date('2026-11-05T13:00:00.000Z'),
      endsAt: new Date('2026-11-06T00:00:00.000Z'),
      reason: null,
    });

    await expect(startsOf()).resolves.toEqual(['2026-11-05T12:00:00.000Z']);
  });

  it('should not offer slots overlapping a scheduled appointment', async () => {
    await fixture.repositories.appointmentRepository.create({
      providerId: fixture.provider.id,
      clientId: fixture.client.id,
      serviceId: fixture.service.id,
      startsAt: new Date('2026-11-05T12:30:00.000Z'),
      endsAt: new Date('2026-11-05T13:30:00.000Z'),
    });

    await expect(startsOf()).resolves.toEqual([]);
  });

  it('should ignore canceled appointments', async () => {
    const appointment = await fixture.repositories.appointmentRepository.create({
      providerId: fixture.provider.id,
      clientId: fixture.client.id,
      serviceId: fixture.service.id,
      startsAt: new Date('2026-11-05T12:00:00.000Z'),
      endsAt: new Date('2026-11-05T13:00:00.000Z'),
    });
    appointment.status = 'CANCELED';

    await expect(startsOf()).resolves.toHaveLength(5);
  });

  it('should ignore time offs of other providers', async () => {
    await fixture.repositories.timeOffRepository.create({
      providerId: 'another-provider',
      startsAt: new Date('2026-11-05T00:00:00.000Z'),
      endsAt: new Date('2026-11-06T00:00:00.000Z'),
      reason: null,
    });

    await expect(startsOf()).resolves.toHaveLength(5);
  });

  it('should fail for an unknown provider', async () => {
    await expect(execute({ providerId: 'missing' })).rejects.toBeInstanceOf(ProviderNotFoundError);
  });

  it('should treat a client id as an unknown provider', async () => {
    await expect(execute({ providerId: fixture.client.id })).rejects.toBeInstanceOf(
      ProviderNotFoundError,
    );
  });

  it('should not offer slots for an inactive service', async () => {
    await fixture.repositories.serviceRepository.update(fixture.service.id, { active: false });

    await expect(execute()).rejects.toBeInstanceOf(ServiceNotFoundError);
  });

  it('should not offer slots for a service of another provider', async () => {
    const otherService = await fixture.repositories.serviceRepository.create({
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
