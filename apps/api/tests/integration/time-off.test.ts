import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';
import { createAppDependencies } from '../../src/infra/container.js';
import { prisma } from '../../src/infra/database/prisma-client.js';
import { createApp } from '../../src/infra/http/app.js';

// Far from the real clock on purpose: integration tests run with the system clock.
const VACATION = {
  startsAt: '2030-12-20T03:00:00.000Z',
  endsAt: '2031-01-05T03:00:00.000Z',
  reason: 'Férias',
};
const UNKNOWN_ID = '01970000-0000-7000-8000-000000000000';

describe('Time off API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(createAppDependencies(prisma, env));
  });

  async function signUp(email: string, role: 'CLIENT' | 'PROVIDER' = 'PROVIDER') {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Teste', email, password: 'secret123', role });
    return {
      userId: response.body.user.id as string,
      auth: { Authorization: `Bearer ${response.body.accessToken as string}` },
    };
  }

  function create(auth: Record<string, string>, body: object = VACATION) {
    return request(app).post('/api/v1/time-off').set(auth).send(body);
  }

  describe('POST /api/v1/time-off', () => {
    it('should create a time off for the authenticated provider', async () => {
      const provider = await signUp('pro@example.com');

      const response = await create(provider.auth);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        timeOff: {
          id: expect.any(String),
          providerId: provider.userId,
          ...VACATION,
          createdAt: expect.stringMatching(/Z$/),
        },
      });
    });

    it('should store instants given with an offset in UTC', async () => {
      const provider = await signUp('pro@example.com');

      const response = await create(provider.auth, {
        startsAt: '2030-12-20T00:00:00-03:00',
        endsAt: '2030-12-21T00:00:00-03:00',
      });

      expect(response.body.timeOff).toMatchObject({
        startsAt: '2030-12-20T03:00:00.000Z',
        reason: null,
      });
    });

    it('should return 400 for a time off that has already ended', async () => {
      const provider = await signUp('pro@example.com');

      const response = await create(provider.auth, {
        startsAt: '2020-01-01T00:00:00.000Z',
        endsAt: '2020-01-02T00:00:00.000Z',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_TIME_OFF_PERIOD');
    });

    it('should return 400 for a date without an explicit timezone', async () => {
      const provider = await signUp('pro@example.com');

      const response = await create(provider.auth, {
        startsAt: '2030-12-20T00:00:00',
        endsAt: '2030-12-21T00:00:00',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 403 for a CLIENT', async () => {
      const client = await signUp('client@example.com', 'CLIENT');

      const response = await create(client.auth);

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/time-off/:id', () => {
    it('should remove the time off', async () => {
      const provider = await signUp('pro@example.com');
      const created = await create(provider.auth);

      const response = await request(app)
        .delete(`/api/v1/time-off/${created.body.timeOff.id as string}`)
        .set(provider.auth);

      expect(response.status).toBe(204);
      await expect(prisma.timeOff.count()).resolves.toBe(0);
    });

    it('should return 404 when the time off belongs to another provider', async () => {
      const owner = await signUp('owner@example.com');
      const intruder = await signUp('intruder@example.com');
      const created = await create(owner.auth);

      const response = await request(app)
        .delete(`/api/v1/time-off/${created.body.timeOff.id as string}`)
        .set(intruder.auth);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('TIME_OFF_NOT_FOUND');
      await expect(prisma.timeOff.count()).resolves.toBe(1);
    });

    it('should return 404 for an unknown id', async () => {
      const provider = await signUp('pro@example.com');

      const response = await request(app)
        .delete(`/api/v1/time-off/${UNKNOWN_ID}`)
        .set(provider.auth);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/time-off', () => {
    it('should list the upcoming time offs of the provider by start', async () => {
      const provider = await signUp('pro@example.com');
      const other = await signUp('other@example.com');
      const later = await create(provider.auth);
      const sooner = await create(provider.auth, {
        startsAt: '2030-06-01T03:00:00.000Z',
        endsAt: '2030-06-02T03:00:00.000Z',
      });
      await create(other.auth);

      const response = await request(app).get('/api/v1/time-off').set(provider.auth);

      expect(response.status).toBe(200);
      expect((response.body.timeOffs as { id: string }[]).map((item) => item.id)).toEqual([
        sooner.body.timeOff.id,
        later.body.timeOff.id,
      ]);
      expect(response.body.timeOffs[1]).toMatchObject(VACATION);
    });

    it('should return 403 for a CLIENT', async () => {
      const client = await signUp('client@example.com', 'CLIENT');

      const response = await request(app).get('/api/v1/time-off').set(client.auth);

      expect(response.status).toBe(403);
    });
  });
});
