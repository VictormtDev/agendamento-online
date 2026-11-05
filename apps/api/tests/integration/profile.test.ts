import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';
import { createAppDependencies } from '../../src/infra/container.js';
import { prisma } from '../../src/infra/database/prisma-client.js';
import { createApp } from '../../src/infra/http/app.js';

describe('PATCH /api/v1/me', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(createAppDependencies(prisma, env));
  });

  async function signUp() {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Teste',
      email: 'pro@example.com',
      password: 'secret123',
      role: 'PROVIDER',
    });
    return { Authorization: `Bearer ${response.body.accessToken as string}` };
  }

  it('should update the timezone and return the updated profile', async () => {
    const auth = await signUp();

    const response = await request(app)
      .patch('/api/v1/me')
      .set(auth)
      .send({ timezone: 'America/Manaus' });

    expect(response.status).toBe(200);
    expect(response.body.user.timezone).toBe('America/Manaus');
    const me = await request(app).get('/api/v1/me').set(auth);
    expect(me.body.user.timezone).toBe('America/Manaus');
  });

  it.each(['Mars/Olympus', '-03:00', 'america/sao_paulo'])(
    'should return 400 for the timezone %j',
    async (timezone) => {
      const auth = await signUp();

      const response = await request(app).patch('/api/v1/me').set(auth).send({ timezone });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    },
  );

  it('should return 401 without a token', async () => {
    const response = await request(app).patch('/api/v1/me').send({ timezone: 'UTC' });

    expect(response.status).toBe(401);
  });
});
