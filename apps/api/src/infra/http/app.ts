import express, { type Express } from 'express';
import { z } from 'zod';
import type { TokenService } from '../../application/ports/token-service.js';
import type { AuthenticateUser } from '../../application/use-cases/authenticate-user.js';
import type { CreateService } from '../../application/use-cases/create-service.js';
import type { DeleteService } from '../../application/use-cases/delete-service.js';
import type { GetUserProfile } from '../../application/use-cases/get-user-profile.js';
import type { RegisterUser } from '../../application/use-cases/register-user.js';
import type { UpdateService } from '../../application/use-cases/update-service.js';
import type { DatabaseCheck } from './controllers/health-controller.js';
import { createEnsureAuthenticated } from './middlewares/ensure-authenticated.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFound } from './middlewares/not-found.js';
import { createAuthRouter } from './routes/auth-routes.js';
import { createHealthRouter } from './routes/health-routes.js';
import { createProfileRouter } from './routes/profile-routes.js';
import { createServiceRouter } from './routes/service-routes.js';

// Validation messages are shown to end users, who read Portuguese.
z.config(z.locales.pt());

export interface AppDependencies {
  checkDatabase: DatabaseCheck;
  tokenService: TokenService;
  registerUser: RegisterUser;
  authenticateUser: AuthenticateUser;
  getUserProfile: GetUserProfile;
  createService: CreateService;
  updateService: UpdateService;
  deleteService: DeleteService;
}

// Building the app separately from listening lets tests drive it with Supertest
// and swap dependencies without opening a port.
export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  const ensureAuthenticated = createEnsureAuthenticated(dependencies.tokenService);

  app.use('/api/v1', createHealthRouter(dependencies.checkDatabase));
  app.use('/api/v1', createAuthRouter(dependencies.registerUser, dependencies.authenticateUser));
  app.use('/api/v1', createProfileRouter(dependencies.getUserProfile, ensureAuthenticated));
  app.use('/api/v1', createServiceRouter(dependencies, ensureAuthenticated));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
