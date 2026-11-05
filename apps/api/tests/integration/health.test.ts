import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';
import { createAppDependencies } from '../../src/infra/container.js';
import { prisma } from '../../src/infra/database/prisma-client.js';
import { createApp } from '../../src/infra/http/app.js';

// Exercises the real wiring (env -> PrismaPg adapter -> Postgres) that unit tests fake out.
describe('GET /api/v1/health (real database)', () => {
  it('should return 200 when connected to the test database', async () => {
    const app = createApp(createAppDependencies(prisma, env));

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should be connected to the test database, never the development one', async () => {
    const [row] = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;

    expect(row?.db).toBe('scheduling_test');
  });
});
