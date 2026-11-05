import { TZDate } from '@date-fns/tz';
import { addDays, addHours, format } from 'date-fns';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';
import { createAppDependencies } from '../../src/infra/container.js';
import { prisma } from '../../src/infra/database/prisma-client.js';
import { createApp } from '../../src/infra/http/app.js';

const TIMEZONE = 'America/Sao_Paulo';
// A week ahead: far enough for the client to still be inside the 24-hour deadline.
const NEXT_WEEK = format(addDays(new TZDate(Date.now(), TIMEZONE), 7), 'yyyy-MM-dd');
const UNKNOWN_ID = '01970000-0000-7000-8000-000000000000';

describe('PATCH /api/v1/appointments/:id/cancel', () => {
  let app: ReturnType<typeof createApp>;
  let provider: { id: string; auth: Record<string, string> };
  let client: { id: string; auth: Record<string, string> };
  let serviceId: string;
  let appointmentId: string;

  async function signUp(email: string, role: 'CLIENT' | 'PROVIDER') {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Teste', email, password: 'secret123', role, timezone: TIMEZONE });
    return {
      id: response.body.user.id as string,
      auth: { Authorization: `Bearer ${response.body.accessToken as string}` },
    };
  }

  function cancel(auth: Record<string, string>, id = appointmentId) {
    return request(app).patch(`/api/v1/appointments/${id}/cancel`).set(auth);
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
      .send({
        windows: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
          weekday,
          startTime: '09:00',
          endTime: '11:00',
        })),
      });
    const booking = await request(app)
      .post('/api/v1/appointments')
      .set(client.auth)
      .send({ providerId: provider.id, serviceId, startsAt: `${NEXT_WEEK}T09:00:00-03:00` });
    appointmentId = booking.body.appointment.id;
  });

  it('should let the client cancel ahead of the deadline', async () => {
    const response = await cancel(client.auth);

    expect(response.status).toBe(200);
    expect(response.body.appointment).toMatchObject({
      id: appointmentId,
      status: 'CANCELED',
      canceledAt: expect.stringMatching(/Z$/),
    });
  });

  it('should let the provider cancel', async () => {
    const response = await cancel(provider.auth);

    expect(response.status).toBe(200);
    expect(response.body.appointment.status).toBe('CANCELED');
  });

  it('should make the slot bookable again', async () => {
    await cancel(client.auth);

    const slots = await request(app)
      .get(`/api/v1/providers/${provider.id}/slots`)
      .query({ serviceId, date: NEXT_WEEK });

    expect(slots.body.slots[0].startsAt).toBe(`${NEXT_WEEK}T12:00:00.000Z`);
  });

  it('should return 409 APPOINTMENT_ALREADY_CANCELED on a second cancellation', async () => {
    await cancel(client.auth);

    const response = await cancel(provider.auth);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('APPOINTMENT_ALREADY_CANCELED');
  });

  it('should return 409 CANCELLATION_DEADLINE_PASSED for a client inside the last 24 hours', async () => {
    // Moving the appointment close to now directly in the database, since the API
    // itself rightly refuses to book with less than 2 hours of notice.
    const startsAt = addHours(new Date(), 3);
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { startsAt, endsAt: addHours(startsAt, 1) },
    });

    const response = await cancel(client.auth);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CANCELLATION_DEADLINE_PASSED');
  });

  it('should return 404 for a user unrelated to the appointment', async () => {
    const stranger = await signUp('stranger@example.com', 'CLIENT');

    const response = await cancel(stranger.auth);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('APPOINTMENT_NOT_FOUND');
  });

  it('should return 404 for an unknown id', async () => {
    const response = await cancel(client.auth, UNKNOWN_ID);

    expect(response.status).toBe(404);
  });

  it('should return 401 without a token', async () => {
    const response = await request(app).patch(`/api/v1/appointments/${appointmentId}/cancel`);

    expect(response.status).toBe(401);
  });
});
