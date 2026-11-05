import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';
import { createAppDependencies } from '../../src/infra/container.js';
import { prisma } from '../../src/infra/database/prisma-client.js';
import { createApp } from '../../src/infra/http/app.js';

const WEEK = [
  { weekday: 2, startTime: '09:00', endTime: '18:00' },
  { weekday: 1, startTime: '14:00', endTime: '18:00' },
  { weekday: 1, startTime: '09:00', endTime: '12:00' },
];

describe('Availability API', () => {
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

  function replace(auth: Record<string, string>, windows: object[]) {
    return request(app).put('/api/v1/availability').set(auth).send({ windows });
  }

  it('should save the weekly grid ordered by weekday and start time', async () => {
    const provider = await signUp('pro@example.com');

    const response = await replace(provider.auth, WEEK);

    expect(response.status).toBe(200);
    expect(response.body.availability).toEqual([
      { id: expect.any(String), providerId: provider.userId, ...WEEK[2] },
      { id: expect.any(String), providerId: provider.userId, ...WEEK[1] },
      { id: expect.any(String), providerId: provider.userId, ...WEEK[0] },
    ]);
  });

  it('should replace the previous grid entirely', async () => {
    const provider = await signUp('pro@example.com');
    await replace(provider.auth, WEEK);

    await replace(provider.auth, [{ weekday: 5, startTime: '08:00', endTime: '12:00' }]);

    const stored = await prisma.availability.findMany({ where: { providerId: provider.userId } });
    expect(stored).toHaveLength(1);
    expect(stored[0]?.weekday).toBe(5);
  });

  it('should keep the previous grid when the new one is invalid', async () => {
    const provider = await signUp('pro@example.com');
    await replace(provider.auth, WEEK);

    const response = await replace(provider.auth, [
      { weekday: 1, startTime: '09:00', endTime: '12:00' },
      { weekday: 1, startTime: '11:00', endTime: '13:00' },
    ]);

    expect(response.status).toBe(400);
    await expect(prisma.availability.count()).resolves.toBe(WEEK.length);
  });

  it('should not touch the grid of another provider', async () => {
    const first = await signUp('first@example.com');
    const second = await signUp('second@example.com');
    await replace(first.auth, WEEK);

    await replace(second.auth, []);

    await expect(prisma.availability.count({ where: { providerId: first.userId } })).resolves.toBe(
      WEEK.length,
    );
  });

  it.each([
    ['a weekday out of range', { weekday: 7, startTime: '09:00', endTime: '18:00' }],
    ['a time off the 15-minute grid', { weekday: 1, startTime: '09:10', endTime: '18:00' }],
    ['a window crossing midnight', { weekday: 1, startTime: '22:00', endTime: '02:00' }],
    ['a malformed time', { weekday: 1, startTime: '9h', endTime: '18:00' }],
  ])('should return 400 for %s', async (_case, window) => {
    const provider = await signUp('pro@example.com');

    const response = await replace(provider.auth, [window]);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 403 for a CLIENT', async () => {
    const client = await signUp('client@example.com', 'CLIENT');

    const response = await replace(client.auth, WEEK);

    expect(response.status).toBe(403);
  });

  it('should return 401 without a token', async () => {
    const response = await request(app).put('/api/v1/availability').send({ windows: WEEK });

    expect(response.status).toBe(401);
  });

  describe('GET /api/v1/availability', () => {
    it('should return the saved grid of the provider, ordered', async () => {
      const provider = await signUp('pro@example.com');
      const other = await signUp('other@example.com');
      await replace(provider.auth, WEEK);
      await replace(other.auth, [{ weekday: 0, startTime: '09:00', endTime: '10:00' }]);

      const response = await request(app).get('/api/v1/availability').set(provider.auth);

      expect(response.status).toBe(200);
      expect(response.body.availability).toEqual([
        { id: expect.any(String), providerId: provider.userId, ...WEEK[2] },
        { id: expect.any(String), providerId: provider.userId, ...WEEK[1] },
        { id: expect.any(String), providerId: provider.userId, ...WEEK[0] },
      ]);
    });

    it('should return an empty grid before the first save', async () => {
      const provider = await signUp('pro@example.com');

      const response = await request(app).get('/api/v1/availability').set(provider.auth);

      expect(response.body.availability).toEqual([]);
    });

    it('should return 403 for a CLIENT', async () => {
      const client = await signUp('client@example.com', 'CLIENT');

      const response = await request(app).get('/api/v1/availability').set(client.auth);

      expect(response.status).toBe(403);
    });
  });
});
