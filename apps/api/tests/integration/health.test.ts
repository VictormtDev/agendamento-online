import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../../src/infra/database/prisma-client.js';
import { createApp } from '../../src/infra/http/app.js';

// Exercises the real wiring (env -> PrismaPg adapter -> Postgres) that unit tests fake out.
describe('GET /api/v1/health (real database)', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return 200 when connected to the test database', async () => {
    const app = createApp({
      checkDatabase: async () => {
        await prisma.$queryRaw`SELECT 1`;
      },
    });

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should be connected to the test database, never the development one', async () => {
    const [row] = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;

    expect(row?.db).toBe('scheduling_test');
  });
});
