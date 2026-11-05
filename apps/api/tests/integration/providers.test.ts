import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';
import { createAppDependencies } from '../../src/infra/container.js';
import { prisma } from '../../src/infra/database/prisma-client.js';
import { createApp } from '../../src/infra/http/app.js';

const UNKNOWN_ID = '01970000-0000-7000-8000-000000000000';

describe('Public provider routes', () => {
  let app: ReturnType<typeof createApp>;

  async function signUp(name: string, role: 'CLIENT' | 'PROVIDER' = 'PROVIDER') {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name,
        email: `${name.toLowerCase().replaceAll(' ', '.')}@example.com`,
        password: 'secret123',
        role,
      });
    return {
      id: response.body.user.id as string,
      auth: { Authorization: `Bearer ${response.body.accessToken as string}` },
    };
  }

  async function createService(auth: Record<string, string>, name: string) {
    const response = await request(app)
      .post('/api/v1/services')
      .set(auth)
      .send({ name, durationMinutes: 30, priceCents: 4000 });
    return response.body.service.id as string;
  }

  beforeEach(() => {
    app = createApp(createAppDependencies(prisma, env));
  });

  describe('GET /api/v1/providers', () => {
    it('should list bookable providers by name, without signing in', async () => {
      const bruno = await signUp('Bruno Lima');
      await createService(bruno.auth, 'Corte');
      const ana = await signUp('Ana Souza');
      await createService(ana.auth, 'Massagem');
      await createService(ana.auth, 'Drenagem');
      await signUp('Sem Servicos');

      const response = await request(app).get('/api/v1/providers');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: [
          { id: ana.id, name: 'Ana Souza', activeServiceCount: 2 },
          { id: bruno.id, name: 'Bruno Lima', activeServiceCount: 1 },
        ],
        meta: { page: 1, perPage: 20, total: 2 },
      });
    });

    it('should not count deleted services', async () => {
      const bruno = await signUp('Bruno Lima');
      const serviceId = await createService(bruno.auth, 'Corte');
      await request(app).delete(`/api/v1/services/${serviceId}`).set(bruno.auth);

      const response = await request(app).get('/api/v1/providers');

      expect(response.body.data).toEqual([]);
    });

    it('should honor page and perPage', async () => {
      for (const name of ['Ana Souza', 'Bruno Lima', 'Carla Dias']) {
        const provider = await signUp(name);
        await createService(provider.auth, 'Corte');
      }

      const response = await request(app).get('/api/v1/providers').query({ page: 2, perPage: 2 });

      expect((response.body.data as { name: string }[]).map((item) => item.name)).toEqual([
        'Carla Dias',
      ]);
      expect(response.body.meta).toEqual({ page: 2, perPage: 2, total: 3 });
    });

    it('should return 400 for perPage above 100', async () => {
      const response = await request(app).get('/api/v1/providers').query({ perPage: 101 });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/providers/:id', () => {
    it('should return the profile with the active services only', async () => {
      const bruno = await signUp('Bruno Lima');
      const corte = await createService(bruno.auth, 'Corte');
      const removed = await createService(bruno.auth, 'Barba');
      await request(app).delete(`/api/v1/services/${removed}`).set(bruno.auth);

      const response = await request(app).get(`/api/v1/providers/${bruno.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        provider: { id: bruno.id, name: 'Bruno Lima', timezone: 'America/Sao_Paulo' },
        services: [{ id: corte, name: 'Corte', durationMinutes: 30, priceCents: 4000 }],
      });
    });

    it('should return 404 for a client id', async () => {
      const client = await signUp('Carla Dias', 'CLIENT');

      const response = await request(app).get(`/api/v1/providers/${client.id}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('PROVIDER_NOT_FOUND');
    });

    it('should return 404 for an unknown id', async () => {
      const response = await request(app).get(`/api/v1/providers/${UNKNOWN_ID}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for an invalid id', async () => {
      const response = await request(app).get('/api/v1/providers/not-a-uuid');

      expect(response.status).toBe(400);
    });
  });
});
