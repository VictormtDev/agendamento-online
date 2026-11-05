import { TZDate } from '@date-fns/tz';
import { addDays, format } from 'date-fns';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';
import { createAppDependencies } from '../../src/infra/container.js';
import { prisma } from '../../src/infra/database/prisma-client.js';
import { createApp } from '../../src/infra/http/app.js';

const TIMEZONE = 'America/Sao_Paulo';
const today = new TZDate(Date.now(), TIMEZONE);
// Two bookings a week ahead, on consecutive days, so the order is predictable.
const DAY_ONE = format(addDays(today, 7), 'yyyy-MM-dd');
const DAY_TWO = format(addDays(today, 8), 'yyyy-MM-dd');

describe('Appointment listings', () => {
  let app: ReturnType<typeof createApp>;
  let provider: { id: string; auth: Record<string, string> };
  let client: { id: string; auth: Record<string, string> };

  async function signUp(email: string, role: 'CLIENT' | 'PROVIDER') {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: `Usuário ${email}`, email, password: 'secret123', role, timezone: TIMEZONE });
    return {
      id: response.body.user.id as string,
      auth: { Authorization: `Bearer ${response.body.accessToken as string}` },
    };
  }

  beforeEach(async () => {
    app = createApp(createAppDependencies(prisma, env));
    provider = await signUp('pro@example.com', 'PROVIDER');
    client = await signUp('client@example.com', 'CLIENT');

    const service = await request(app)
      .post('/api/v1/services')
      .set(provider.auth)
      .send({ name: 'Corte', durationMinutes: 60, priceCents: 5000 });
    await request(app)
      .put('/api/v1/availability')
      .set(provider.auth)
      .send({
        windows: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
          weekday,
          startTime: '09:00',
          endTime: '11:00',
        })),
      });
    for (const day of [DAY_ONE, DAY_TWO]) {
      await request(app)
        .post('/api/v1/appointments')
        .set(client.auth)
        .send({
          providerId: provider.id,
          serviceId: service.body.service.id,
          startsAt: `${day}T09:00:00-03:00`,
        });
    }
  });

  describe('GET /api/v1/appointments', () => {
    it('should return the paginated appointments of the client, newest first', async () => {
      const response = await request(app).get('/api/v1/appointments').set(client.auth);

      expect(response.status).toBe(200);
      expect(response.body.meta).toEqual({ page: 1, perPage: 20, total: 2 });
      expect((response.body.data as { startsAt: string }[]).map((item) => item.startsAt)).toEqual([
        `${DAY_TWO}T12:00:00.000Z`,
        `${DAY_ONE}T12:00:00.000Z`,
      ]);
      expect(response.body.data[0]).toMatchObject({
        status: 'SCHEDULED',
        service: { name: 'Corte', durationMinutes: 60, priceCents: 5000 },
        provider: { id: provider.id, name: 'Usuário pro@example.com', timezone: TIMEZONE },
      });
    });

    it('should honor page and perPage', async () => {
      const response = await request(app)
        .get('/api/v1/appointments')
        .query({ page: 2, perPage: 1 })
        .set(client.auth);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].startsAt).toBe(`${DAY_ONE}T12:00:00.000Z`);
      expect(response.body.meta).toEqual({ page: 2, perPage: 1, total: 2 });
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/appointments')
        .query({ status: 'CANCELED' })
        .set(client.auth);

      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });

    it.each([
      ['perPage above 100', { perPage: 101 }],
      ['page zero', { page: 0 }],
      ['an unknown status', { status: 'DONE' }],
    ])('should return 400 for %s', async (_case, query) => {
      const response = await request(app).get('/api/v1/appointments').query(query).set(client.auth);

      expect(response.status).toBe(400);
    });

    it('should not show appointments of other clients', async () => {
      const other = await signUp('other@example.com', 'CLIENT');

      const response = await request(app).get('/api/v1/appointments').set(other.auth);

      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/v1/provider/appointments', () => {
    function agenda(query: object, auth = provider.auth) {
      return request(app).get('/api/v1/provider/appointments').query(query).set(auth);
    }

    it('should return the agenda in the range chronologically, with service and client', async () => {
      const response = await agenda({
        from: `${DAY_ONE}T00:00:00-03:00`,
        to: `${DAY_TWO}T23:59:00-03:00`,
      });

      expect(response.status).toBe(200);
      expect((response.body.data as { startsAt: string }[]).map((item) => item.startsAt)).toEqual([
        `${DAY_ONE}T12:00:00.000Z`,
        `${DAY_TWO}T12:00:00.000Z`,
      ]);
      expect(response.body.data[0].client).toEqual({
        id: client.id,
        name: 'Usuário client@example.com',
      });
    });

    it('should only include appointments inside the range', async () => {
      const response = await agenda({
        from: `${DAY_ONE}T00:00:00-03:00`,
        to: `${DAY_ONE}T23:59:00-03:00`,
      });

      expect(response.body.data).toHaveLength(1);
    });

    it.each([
      ['a range longer than 31 days', { from: '2030-01-01T00:00:00Z', to: '2030-02-02T00:00:00Z' }],
      ['an end before the start', { from: '2030-01-02T00:00:00Z', to: '2030-01-01T00:00:00Z' }],
      ['a missing end', { from: '2030-01-01T00:00:00Z' }],
    ])('should return 400 for %s', async (_case, query) => {
      const response = await agenda(query);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 403 for a CLIENT', async () => {
      const response = await agenda(
        { from: '2030-01-01T00:00:00Z', to: '2030-01-02T00:00:00Z' },
        client.auth,
      );

      expect(response.status).toBe(403);
    });
  });
});
