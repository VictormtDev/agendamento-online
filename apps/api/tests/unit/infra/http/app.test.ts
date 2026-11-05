import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../../../src/infra/http/app.js';
import { createFakeDependencies } from '../../../fakes/create-fake-dependencies.js';

describe('HTTP app', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 when the database responds', async () => {
      const app = createApp(createFakeDependencies());

      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });

    it('should return 503 in the standard error format when the database is down', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const app = createApp(
        createFakeDependencies({
          checkDatabase: () => Promise.reject(new Error('connection refused')),
        }),
      );

      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Banco de dados indisponível',
          details: {},
        },
      });
    });
  });

  it('should return 404 in the standard error format for unknown routes', async () => {
    const app = createApp(createFakeDependencies());

    const response = await request(app).get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: 'ROUTE_NOT_FOUND', message: 'Rota não encontrada', details: {} },
    });
  });

  it('should not expose the framework in response headers', async () => {
    const app = createApp(createFakeDependencies());

    const response = await request(app).get('/api/v1/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
