import { TZDate } from '@date-fns/tz';
import { addDays, format } from 'date-fns';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';
import { SlotUnavailableError } from '../../src/domain/errors/slot-unavailable-error.js';
import { createAppDependencies } from '../../src/infra/container.js';
import { prisma } from '../../src/infra/database/prisma-client.js';
import { PrismaAppointmentRepository } from '../../src/infra/database/prisma-appointment-repository.js';
import { createApp } from '../../src/infra/http/app.js';

const TIMEZONE = 'America/Sao_Paulo';
const CONCURRENT_CLIENTS = 5;
const NEXT_WEEK = format(addDays(new TZDate(Date.now(), TIMEZONE), 7), 'yyyy-MM-dd');

describe('Double booking protection', () => {
  let app: ReturnType<typeof createApp>;
  let providerId: string;
  let serviceId: string;
  let clientIds: string[];
  let clientAuths: Record<string, string>[];

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
    const provider = await signUp('pro@example.com', 'PROVIDER');
    providerId = provider.id;

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

    const clients = await Promise.all(
      Array.from({ length: CONCURRENT_CLIENTS }, (_, index) =>
        signUp(`client${String(index)}@example.com`, 'CLIENT'),
      ),
    );
    clientIds = clients.map((client) => client.id);
    clientAuths = clients.map((client) => client.auth);
  });

  it('should accept only one of several simultaneous requests for the same slot', async () => {
    const responses = await Promise.all(
      clientAuths.map((auth) =>
        request(app)
          .post('/api/v1/appointments')
          .set(auth)
          .send({ providerId, serviceId, startsAt: `${NEXT_WEEK}T09:00:00-03:00` }),
      ),
    );

    const statuses = responses.map((response) => response.status).sort();
    expect(statuses).toEqual([201, 409, 409, 409, 409]);
    for (const response of responses.filter((item) => item.status === 409)) {
      expect(response.body.error.code).toBe('SLOT_UNAVAILABLE');
    }
    await expect(prisma.appointment.count()).resolves.toBe(1);
  });

  describe('database constraint', () => {
    // These bypass the use case on purpose: the database must refuse an overlap
    // even when the application check is skipped or loses a race.
    const startsAt = new Date(`${NEXT_WEEK}T12:00:00.000Z`);
    const endsAt = new Date(`${NEXT_WEEK}T13:00:00.000Z`);

    function appointment(clientIndex: number, start = startsAt, end = endsAt) {
      return {
        providerId,
        clientId: clientIds[clientIndex] ?? '',
        serviceId,
        startsAt: start,
        endsAt: end,
      };
    }

    it('should turn an overlapping insert into SlotUnavailableError', async () => {
      const repository = new PrismaAppointmentRepository(prisma);
      await repository.create(appointment(0));

      await expect(
        repository.create(
          appointment(
            1,
            new Date(`${NEXT_WEEK}T12:30:00.000Z`),
            new Date(`${NEXT_WEEK}T13:30:00.000Z`),
          ),
        ),
      ).rejects.toBeInstanceOf(SlotUnavailableError);
    });

    it('should allow appointments that only touch each other', async () => {
      const repository = new PrismaAppointmentRepository(prisma);
      await repository.create(appointment(0));

      await expect(
        repository.create(appointment(1, endsAt, new Date(`${NEXT_WEEK}T14:00:00.000Z`))),
      ).resolves.toBeDefined();
    });

    it('should not let a canceled appointment block the slot', async () => {
      await prisma.appointment.create({
        data: { ...appointment(0), status: 'CANCELED', canceledAt: new Date() },
      });

      await expect(
        new PrismaAppointmentRepository(prisma).create(appointment(1)),
      ).resolves.toBeDefined();
    });

    it('should allow the same time for different providers', async () => {
      const other = await signUp('other-pro@example.com', 'PROVIDER');
      const otherService = await prisma.service.create({
        data: { providerId: other.id, name: 'Corte', durationMinutes: 60, priceCents: 5000 },
      });
      const repository = new PrismaAppointmentRepository(prisma);
      await repository.create(appointment(0));

      await expect(
        repository.create({ ...appointment(1), providerId: other.id, serviceId: otherService.id }),
      ).resolves.toBeDefined();
    });
  });
});
