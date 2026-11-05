import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';
import { createAppDependencies } from '../../src/infra/container.js';
import { prisma } from '../../src/infra/database/prisma-client.js';
import { createApp } from '../../src/infra/http/app.js';

const NEW_USER = { name: 'Ana Souza', email: 'ana@example.com', password: 'secret123' };

describe('Auth API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(createAppDependencies(prisma, env));
  });

  function register(body: object = NEW_USER) {
    return request(app).post('/api/v1/auth/register').send(body);
  }

  describe('POST /api/v1/auth/register', () => {
    it('should create a CLIENT by default and return the profile with an access token', async () => {
      const response = await register();

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        user: {
          id: expect.any(String),
          name: 'Ana Souza',
          email: 'ana@example.com',
          role: 'CLIENT',
          createdAt: expect.stringMatching(/Z$/),
        },
        accessToken: expect.any(String),
      });
    });

    it('should create a PROVIDER when that role is chosen', async () => {
      const response = await register({ ...NEW_USER, role: 'PROVIDER' });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('PROVIDER');
    });

    it('should store a bcrypt hash instead of the plain password', async () => {
      await register();

      const stored = await prisma.user.findUniqueOrThrow({ where: { email: NEW_USER.email } });
      expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it('should return 409 when the email is already registered', async () => {
      await register();

      const response = await register({ ...NEW_USER, email: 'ANA@example.com' });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('EMAIL_ALREADY_IN_USE');
    });

    it('should accept only one of two simultaneous sign-ups with the same email', async () => {
      const responses = await Promise.all([register(), register()]);

      expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
      await expect(prisma.user.count()).resolves.toBe(1);
    });

    it('should return 400 listing every invalid field', async () => {
      const response = await register({ name: '', email: 'not-an-email', password: '123' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      const paths = (response.body.error.details.issues as { path: string }[]).map((i) => i.path);
      expect(paths.sort()).toEqual(['email', 'name', 'password']);
    });

    it('should reject an unknown role', async () => {
      const response = await register({ ...NEW_USER, role: 'ADMIN' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await register();
    });

    it('should return the profile and an access token for valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'ana@example.com', password: 'secret123' });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('ana@example.com');
      expect(response.body.accessToken).toEqual(expect.any(String));
    });

    it('should return 401 for a wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'ana@example.com', password: 'wrong-password' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return the same 401 for an unknown email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'secret123' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/v1/me', () => {
    it('should return the authenticated user profile', async () => {
      const { body } = await register();

      const response = await request(app)
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${String(body.accessToken)}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: body.user });
    });

    it('should return 401 without an Authorization header', async () => {
      const response = await request(app).get('/api/v1/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('should return 401 for an invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/me')
        .set('Authorization', 'Bearer not-a-real-token');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return 404 when the token belongs to a user that no longer exists', async () => {
      const { body } = await register();
      await prisma.user.deleteMany();

      const response = await request(app)
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${String(body.accessToken)}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });
});
