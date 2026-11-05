import { beforeEach, describe, expect, it } from 'vitest';
import { ListClientAppointments } from '../../../../src/application/use-cases/list-client-appointments.js';
import { ListProviderAppointments } from '../../../../src/application/use-cases/list-provider-appointments.js';
import { createAgendaFixture } from '../../../fakes/create-agenda-fixture.js';

describe('appointment listings', () => {
  let fixture: Awaited<ReturnType<typeof createAgendaFixture>>;

  // Three one-hour appointments on consecutive days at 12:00 UTC; the middle one is canceled.
  beforeEach(async () => {
    fixture = await createAgendaFixture();
    for (const day of ['05', '06', '07']) {
      await fixture.repositories.appointmentRepository.create({
        providerId: fixture.provider.id,
        clientId: fixture.client.id,
        serviceId: fixture.service.id,
        startsAt: new Date(`2026-11-${day}T12:00:00.000Z`),
        endsAt: new Date(`2026-11-${day}T13:00:00.000Z`),
      });
    }
    const middle = fixture.repositories.appointmentRepository.items[1];
    if (middle) {
      middle.status = 'CANCELED';
    }
  });

  describe('ListClientAppointments', () => {
    function list(overrides: object = {}) {
      return new ListClientAppointments(fixture.repositories.appointmentRepository).execute({
        clientId: fixture.client.id,
        page: 1,
        perPage: 20,
        ...overrides,
      });
    }

    it('should list the client appointments newest first, with service and provider', async () => {
      const page = await list();

      expect(page.data.map((item) => item.startsAt.toISOString())).toEqual([
        '2026-11-07T12:00:00.000Z',
        '2026-11-06T12:00:00.000Z',
        '2026-11-05T12:00:00.000Z',
      ]);
      expect(page.data[0]).toMatchObject({
        service: { id: fixture.service.id, name: 'Corte', durationMinutes: 60, priceCents: 5000 },
        provider: { id: fixture.provider.id, name: 'Bruno Lima', timezone: 'America/Sao_Paulo' },
      });
      expect(page.meta).toEqual({ page: 1, perPage: 20, total: 3 });
    });

    it('should paginate, keeping the total of all matching appointments', async () => {
      const page = await list({ page: 2, perPage: 2 });

      expect(page.data.map((item) => item.startsAt.toISOString())).toEqual([
        '2026-11-05T12:00:00.000Z',
      ]);
      expect(page.meta).toEqual({ page: 2, perPage: 2, total: 3 });
    });

    it('should filter by status', async () => {
      const page = await list({ status: 'CANCELED' });

      expect(page.data).toHaveLength(1);
      expect(page.meta.total).toBe(1);
    });

    it('should not list appointments of other clients', async () => {
      const page = await list({ clientId: fixture.provider.id });

      expect(page.data).toEqual([]);
    });
  });

  describe('ListProviderAppointments', () => {
    function list(start: string, end: string, overrides: object = {}) {
      return new ListProviderAppointments(fixture.repositories.appointmentRepository).execute({
        providerId: fixture.provider.id,
        interval: { start: new Date(start), end: new Date(end) },
        ...overrides,
      });
    }

    it('should list appointments in the range chronologically, canceled included', async () => {
      const items = await list('2026-11-05T00:00:00.000Z', '2026-11-08T00:00:00.000Z');

      expect(items.map((item) => item.status)).toEqual(['SCHEDULED', 'CANCELED', 'SCHEDULED']);
      expect(items[0]).toMatchObject({
        service: { name: 'Corte' },
        client: { id: fixture.client.id, name: 'Carla Dias' },
      });
      expect(items[0]).not.toHaveProperty('client.email');
    });

    it('should include an appointment that only partly falls in the range', async () => {
      const items = await list('2026-11-05T12:30:00.000Z', '2026-11-06T00:00:00.000Z');

      expect(items).toHaveLength(1);
    });

    it('should filter by status', async () => {
      const items = await list('2026-11-05T00:00:00.000Z', '2026-11-08T00:00:00.000Z', {
        status: 'SCHEDULED',
      });

      expect(items).toHaveLength(2);
    });
  });
});
