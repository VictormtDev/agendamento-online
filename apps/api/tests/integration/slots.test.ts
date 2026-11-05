import { TZDate } from '@date-fns/tz';
import { addDays, format } from 'date-fns';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';
import { createAppDependencies } from '../../src/infra/container.js';
import { prisma } from '../../src/infra/database/prisma-client.js';
import { createApp } from '../../src/infra/http/app.js';

const TIMEZONE = 'America/Sao_Paulo';
const EVERY_DAY_MORNING = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  startTime: '09:00',
  endTime: '11:00',
}));
const UNKNOWN_ID = '01970000-0000-7000-8000-000000000000';

// Integration tests run on the system clock, so the date is picked relative to today
// (a week ahead: past the 2-hour notice and well inside the 60-day window).
const NEXT_WEEK = format(addDays(new TZDate(Date.now(), TIMEZONE), 7), 'yyyy-MM-dd');

describe('GET /api/v1/providers/:id/slots', () => {
  let app: ReturnType<typeof createApp>;
  let providerId: string;
  let serviceId: string;
  let providerAuth: Record<string, string>;

  beforeEach(async () => {
    app = createApp(createAppDependencies(prisma, env));

    const signUp = await request(app).post('/api/v1/auth/register').send({
      name: 'Bruno Lima',
      email: 'bruno@example.com',
      password: 'secret123',
      role: 'PROVIDER',
      timezone: TIMEZONE,
    });
    providerId = signUp.body.user.id;
    providerAuth = { Authorization: `Bearer ${signUp.body.accessToken as string}` };

    const service = await request(app)
      .post('/api/v1/services')
      .set(providerAuth)
      .send({ name: 'Corte', durationMinutes: 60, priceCents: 5000 });
    serviceId = service.body.service.id;

    await request(app)
      .put('/api/v1/availability')
      .set(providerAuth)
      .send({ windows: EVERY_DAY_MORNING });
  });

  function getSlots(
    query: Record<string, string> = { serviceId, date: NEXT_WEEK },
    id = providerId,
  ) {
    return request(app).get(`/api/v1/providers/${id}/slots`).query(query);
  }

  it('should list free slots without authentication', async () => {
    const response = await getSlots();

    expect(response.status).toBe(200);
    expect(response.body.timezone).toBe(TIMEZONE);
    expect(response.body.slots).toHaveLength(5);
    expect(response.body.slots[0]).toEqual({
      startsAt: `${NEXT_WEEK}T12:00:00.000Z`,
      endsAt: `${NEXT_WEEK}T13:00:00.000Z`,
    });
  });

  it('should not list slots during a time off', async () => {
    await request(app)
      .post('/api/v1/time-off')
      .set(providerAuth)
      .send({ startsAt: `${NEXT_WEEK}T00:00:00-03:00`, endsAt: `${NEXT_WEEK}T23:59:00-03:00` });

    const response = await getSlots();

    expect(response.body.slots).toEqual([]);
  });

  it('should return 404 for an inactive service', async () => {
    await request(app).delete(`/api/v1/services/${serviceId}`).set(providerAuth);

    const response = await getSlots();

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
  });

  it('should return 404 for an unknown provider', async () => {
    const response = await getSlots({ serviceId, date: NEXT_WEEK }, UNKNOWN_ID);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('PROVIDER_NOT_FOUND');
  });

  it.each([
    ['an impossible date', { date: '2026-02-30' }],
    ['a date in another format', { date: '05/11/2026' }],
    ['a missing serviceId', { serviceId: undefined }],
  ])('should return 400 for %s', async (_case, override) => {
    const query = Object.fromEntries(
      Object.entries({ serviceId, date: NEXT_WEEK, ...override }).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    );

    const response = await getSlots(query);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
