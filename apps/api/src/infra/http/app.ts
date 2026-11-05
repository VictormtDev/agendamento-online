import express, { type Express } from 'express';
import { z } from 'zod';
import type { TokenService } from '../../application/ports/token-service.js';
import type { AuthenticateUser } from '../../application/use-cases/authenticate-user.js';
import type { CreateTimeOff } from '../../application/use-cases/create-time-off.js';
import type { CancelAppointment } from '../../application/use-cases/cancel-appointment.js';
import type { CreateAppointment } from '../../application/use-cases/create-appointment.js';
import type { CreateService } from '../../application/use-cases/create-service.js';
import type { DeleteService } from '../../application/use-cases/delete-service.js';
import type { DeleteTimeOff } from '../../application/use-cases/delete-time-off.js';
import type { GetAvailableSlots } from '../../application/use-cases/get-available-slots.js';
import type { GetProviderProfile } from '../../application/use-cases/get-provider-profile.js';
import type { GetUserProfile } from '../../application/use-cases/get-user-profile.js';
import type { ListClientAppointments } from '../../application/use-cases/list-client-appointments.js';
import type { ListProviderAppointments } from '../../application/use-cases/list-provider-appointments.js';
import type { ListProviders } from '../../application/use-cases/list-providers.js';
import type { RegisterUser } from '../../application/use-cases/register-user.js';
import type { ReplaceAvailability } from '../../application/use-cases/replace-availability.js';
import type { UpdateService } from '../../application/use-cases/update-service.js';
import type { UpdateUserTimezone } from '../../application/use-cases/update-user-timezone.js';
import type { DatabaseCheck } from './controllers/health-controller.js';
import { createEnsureAuthenticated } from './middlewares/ensure-authenticated.js';
import { createEnsureRole } from './middlewares/ensure-role.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFound } from './middlewares/not-found.js';
import { createAppointmentRouter } from './routes/appointment-routes.js';
import { createAuthRouter } from './routes/auth-routes.js';
import { createAvailabilityRouter } from './routes/availability-routes.js';
import { createHealthRouter } from './routes/health-routes.js';
import { createProfileRouter } from './routes/profile-routes.js';
import { createProviderRouter } from './routes/provider-routes.js';
import { createServiceRouter } from './routes/service-routes.js';
import { createTimeOffRouter } from './routes/time-off-routes.js';

// Validation messages are shown to end users, who read Portuguese.
z.config(z.locales.pt());

export interface AppDependencies {
  checkDatabase: DatabaseCheck;
  tokenService: TokenService;
  registerUser: RegisterUser;
  authenticateUser: AuthenticateUser;
  getUserProfile: GetUserProfile;
  updateUserTimezone: UpdateUserTimezone;
  createService: CreateService;
  updateService: UpdateService;
  deleteService: DeleteService;
  replaceAvailability: ReplaceAvailability;
  createTimeOff: CreateTimeOff;
  deleteTimeOff: DeleteTimeOff;
  listProviders: ListProviders;
  getProviderProfile: GetProviderProfile;
  getAvailableSlots: GetAvailableSlots;
  createAppointment: CreateAppointment;
  cancelAppointment: CancelAppointment;
  listClientAppointments: ListClientAppointments;
  listProviderAppointments: ListProviderAppointments;
}

// Building the app separately from listening lets tests drive it with Supertest
// and swap dependencies without opening a port.
export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  const ensureAuthenticated = createEnsureAuthenticated(dependencies.tokenService);
  // Applied per route, not with router.use(): routers are mounted at /api/v1, so a
  // router-level guard would turn every unknown URL into a 401 instead of a 404.
  const providerOnly = [ensureAuthenticated, createEnsureRole('PROVIDER')];

  app.use('/api/v1', createHealthRouter(dependencies.checkDatabase));
  app.use('/api/v1', createAuthRouter(dependencies.registerUser, dependencies.authenticateUser));
  app.use('/api/v1', createProfileRouter(dependencies, ensureAuthenticated));
  app.use('/api/v1', createServiceRouter(dependencies, providerOnly));
  app.use('/api/v1', createAvailabilityRouter(dependencies.replaceAvailability, providerOnly));
  app.use('/api/v1', createTimeOffRouter(dependencies, providerOnly));
  app.use('/api/v1', createProviderRouter(dependencies));
  app.use('/api/v1', createAppointmentRouter(dependencies, ensureAuthenticated, providerOnly));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
