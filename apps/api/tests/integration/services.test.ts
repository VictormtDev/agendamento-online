import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';
import { createAppDependencies } from '../../src/infra/container.js';
import { prisma } from '../../src/infra/database/prisma-client.js';
import { createApp } from '../../src/infra/http/app.js';

const NEW_SERVICE = { name: 'Corte de cabelo', durationMinutes: 30, priceCents: 5000 };
const UNKNOWN_ID = '01970000-0000-7000-8000-000000000000';

describe('Services API', () => {
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

  async function createServiceAs(auth: Record<string, string>, body: object = NEW_SERVICE) {
    const response = await request(app).post('/api/v1/services').set(auth).send(body);
    return response.body.service.id as string;
  }

  describe('POST /api/v1/services', () => {
    it('should create an active service owned by the authenticated provider', async () => {
      const provider = await signUp('pro@example.com');

      const response = await request(app)
        .post('/api/v1/services')
        .set(provider.auth)
        .send({ ...NEW_SERVICE, providerId: UNKNOWN_ID });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        service: {
          id: expect.any(String),
          providerId: provider.userId,
          name: 'Corte de cabelo',
          durationMinutes: 30,
          priceCents: 5000,
          active: true,
          createdAt: expect.stringMatching(/Z$/),
        },
      });
    });

    it('should return 401 without a token', async () => {
      const response = await request(app).post('/api/v1/services').send(NEW_SERVICE);

      expect(response.status).toBe(401);
    });

    it('should return 403 for a CLIENT', async () => {
      const client = await signUp('client@example.com', 'CLIENT');

      const response = await request(app)
        .post('/api/v1/services')
        .set(client.auth)
        .send(NEW_SERVICE);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
      await expect(prisma.service.count()).resolves.toBe(0);
    });

    it.each([
      ['a duration off the 15-minute grid', { durationMinutes: 50 }],
      ['a negative price', { priceCents: -1 }],
      ['a fractional price', { priceCents: 10.5 }],
      ['a blank name', { name: '   ' }],
    ])('should return 400 for %s', async (_case, override) => {
      const provider = await signUp('pro@example.com');

      const response = await request(app)
        .post('/api/v1/services')
        .set(provider.auth)
        .send({ ...NEW_SERVICE, ...override });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/v1/services/:id', () => {
    it('should update only the given fields', async () => {
      const provider = await signUp('pro@example.com');
      const serviceId = await createServiceAs(provider.auth);

      const response = await request(app)
        .patch(`/api/v1/services/${serviceId}`)
        .set(provider.auth)
        .send({ priceCents: 6000 });

      expect(response.status).toBe(200);
      expect(response.body.service).toMatchObject({ ...NEW_SERVICE, priceCents: 6000 });
    });

    it('should return 404 when the service belongs to another provider', async () => {
      const owner = await signUp('owner@example.com');
      const intruder = await signUp('intruder@example.com');
      const serviceId = await createServiceAs(owner.auth);

      const response = await request(app)
        .patch(`/api/v1/services/${serviceId}`)
        .set(intruder.auth)
        .send({ priceCents: 1 });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
      const stored = await prisma.service.findUniqueOrThrow({ where: { id: serviceId } });
      expect(stored.priceCents).toBe(5000);
    });

    it('should return 404 for an unknown id', async () => {
      const provider = await signUp('pro@example.com');

      const response = await request(app)
        .patch(`/api/v1/services/${UNKNOWN_ID}`)
        .set(provider.auth)
        .send({ priceCents: 1 });

      expect(response.status).toBe(404);
    });

    it('should return 400 for an id that is not a UUID', async () => {
      const provider = await signUp('pro@example.com');

      const response = await request(app)
        .patch('/api/v1/services/not-a-uuid')
        .set(provider.auth)
        .send({ priceCents: 1 });

      expect(response.status).toBe(400);
    });

    it('should return 400 when no field is given', async () => {
      const provider = await signUp('pro@example.com');
      const serviceId = await createServiceAs(provider.auth);

      const response = await request(app)
        .patch(`/api/v1/services/${serviceId}`)
        .set(provider.auth)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/services/:id', () => {
    it('should deactivate the service and keep the row', async () => {
      const provider = await signUp('pro@example.com');
      const serviceId = await createServiceAs(provider.auth);

      const response = await request(app)
        .delete(`/api/v1/services/${serviceId}`)
        .set(provider.auth);

      expect(response.status).toBe(204);
      const stored = await prisma.service.findUniqueOrThrow({ where: { id: serviceId } });
      expect(stored.active).toBe(false);
    });

    it('should return 404 when the service belongs to another provider', async () => {
      const owner = await signUp('owner@example.com');
      const intruder = await signUp('intruder@example.com');
      const serviceId = await createServiceAs(owner.auth);

      const response = await request(app)
        .delete(`/api/v1/services/${serviceId}`)
        .set(intruder.auth);

      expect(response.status).toBe(404);
      const stored = await prisma.service.findUniqueOrThrow({ where: { id: serviceId } });
      expect(stored.active).toBe(true);
    });
  });
});
