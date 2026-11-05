import express, { type Express } from 'express';
import type { DatabaseCheck } from './controllers/health-controller.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFound } from './middlewares/not-found.js';
import { createHealthRouter } from './routes/health-routes.js';

export interface AppDependencies {
  checkDatabase: DatabaseCheck;
}

// Building the app separately from listening lets tests drive it with Supertest
// and swap dependencies without opening a port.
export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use('/api/v1', createHealthRouter(dependencies.checkDatabase));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
