import { env } from './config/env.js';
import { prisma } from './infra/database/prisma-client.js';
import { createApp } from './infra/http/app.js';

const app = createApp({
  checkDatabase: async () => {
    await prisma.$queryRaw`SELECT 1`;
  },
});

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${String(env.PORT)}`);
});

// Lets in-flight requests finish and releases DB connections when Docker/CI stops the process.
function shutdown(signal: NodeJS.Signals): void {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
