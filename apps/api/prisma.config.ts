import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer reads .env on its own. The file is optional because CI and
// production inject DATABASE_URL directly into the environment.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx --env-file-if-exists=.env prisma/seed.ts',
  },
  datasource: {
    // `prisma generate` does not need a connection, so a missing URL must not break
    // `npm install` on a fresh clone; commands that do connect fail with a clear error.
    url: process.env.DATABASE_URL ?? '',
  },
});
