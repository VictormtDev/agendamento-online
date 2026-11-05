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

// Integration tests run on the system clock, so the day is picked relative to today.
const NEXT_WEEK = format(addDays(new TZDate(Date.now(), TIMEZONE), 7), 'yyyy-MM-dd');
const NINE_AM = `${NEXT_WEEK}T09:00:00-03:00`;

describe('POST /api/v1/appointments', () => {
  let app: ReturnType<typeof createApp>;
  let provider: { id: string; auth: Record<string, string> };
  let client: { id: string; auth: Record<string, string> };
  let serviceId: string;

  async function signUp(email: string, role: 'CLIENT' | 'PROVIDER') {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Teste', email, password: 'secret123', role, timezone: TIMEZONE });
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
    serviceId = service.body.service.id;
    await request(app)
      .put('/api/v1/availability')
      .set(provider.auth)
      .send({ windows: EVERY_DAY_MORNING });
  });

  function book(auth: Record<string, string>, body: object = {}) {
    return request(app)
      .post('/api/v1/appointments')
      .set(auth)
      .send({ providerId: provider.id, serviceId, startsAt: NINE_AM, ...body });
  }

  it('should book a free slot for the authenticated client', async () => {
    const response = await book(client.auth);

    expect(response.status).toBe(201);
    expect(response.body.appointment).toEqual({
      id: expect.any(String),
      providerId: provider.id,
      clientId: client.id,
      serviceId,
      startsAt: `${NEXT_WEEK}T12:00:00.000Z`,
      endsAt: `${NEXT_WEEK}T13:00:00.000Z`,
      status: 'SCHEDULED',
      canceledAt: null,
      createdAt: expect.stringMatching(/Z$/),
    });
  });

  it('should ignore a clientId or endsAt sent in the body', async () => {
    const response = await book(client.auth, {
      clientId: provider.id,
      endsAt: `${NEXT_WEEK}T23:00:00.000Z`,
    });

    expect(response.body.appointment.clientId).toBe(client.id);
    expect(response.body.appointment.endsAt).toBe(`${NEXT_WEEK}T13:00:00.000Z`);
  });

  it('should remove the booked time from the listed slots', async () => {
    await book(client.auth);

    const slots = await request(app)
      .get(`/api/v1/providers/${provider.id}/slots`)
      .query({ serviceId, date: NEXT_WEEK });

    expect(slots.body.slots).toEqual([
      { startsAt: `${NEXT_WEEK}T13:00:00.000Z`, endsAt: `${NEXT_WEEK}T14:00:00.000Z` },
    ]);
  });

  it('should return 409 SLOT_UNAVAILABLE for an overlapping booking', async () => {
    await book(client.auth);
    const other = await signUp('other@example.com', 'CLIENT');

    const response = await book(other.auth, { startsAt: `${NEXT_WEEK}T09:30:00-03:00` });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('SLOT_UNAVAILABLE');
    await expect(prisma.appointment.count()).resolves.toBe(1);
  });

  it('should return 409 SELF_BOOKING_NOT_ALLOWED when a provider books with themselves', async () => {
    const response = await book(provider.auth);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('SELF_BOOKING_NOT_ALLOWED');
  });

  it('should return 409 BOOKING_TOO_SOON for a time in the past', async () => {
    const response = await book(client.auth, { startsAt: '2020-01-01T09:00:00-03:00' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('BOOKING_TOO_SOON');
  });

  it('should return 409 BOOKING_TOO_FAR_AHEAD beyond 60 days', async () => {
    const farDay = format(addDays(new TZDate(Date.now(), TIMEZONE), 90), 'yyyy-MM-dd');

    const response = await book(client.auth, { startsAt: `${farDay}T09:00:00-03:00` });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('BOOKING_TOO_FAR_AHEAD');
  });

  it('should return 400 for a start without an explicit timezone', async () => {
    const response = await book(client.auth, { startsAt: `${NEXT_WEEK}T09:00:00` });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 without a token', async () => {
    const response = await request(app)
      .post('/api/v1/appointments')
      .send({ providerId: provider.id, serviceId, startsAt: NINE_AM });

    expect(response.status).toBe(401);
  });
});
