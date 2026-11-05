import { AuthenticateUser } from '../application/use-cases/authenticate-user.js';
import { CancelAppointment } from '../application/use-cases/cancel-appointment.js';
import { CreateAppointment } from '../application/use-cases/create-appointment.js';
import { CreateTimeOff } from '../application/use-cases/create-time-off.js';
import { CreateService } from '../application/use-cases/create-service.js';
import { DeleteService } from '../application/use-cases/delete-service.js';
import { DeleteTimeOff } from '../application/use-cases/delete-time-off.js';
import { GetAvailableSlots } from '../application/use-cases/get-available-slots.js';
import { GetProviderProfile } from '../application/use-cases/get-provider-profile.js';
import { GetUserProfile } from '../application/use-cases/get-user-profile.js';
import { ListClientAppointments } from '../application/use-cases/list-client-appointments.js';
import { ListProviderAppointments } from '../application/use-cases/list-provider-appointments.js';
import { ListProviders } from '../application/use-cases/list-providers.js';
import { RegisterUser } from '../application/use-cases/register-user.js';
import { ReplaceAvailability } from '../application/use-cases/replace-availability.js';
import { UpdateService } from '../application/use-cases/update-service.js';
import { UpdateUserTimezone } from '../application/use-cases/update-user-timezone.js';
import type { Env } from '../config/env-schema.js';
import type { PrismaClient } from './database/generated/prisma/client.js';
import { PrismaAppointmentRepository } from './database/prisma-appointment-repository.js';
import { PrismaAvailabilityRepository } from './database/prisma-availability-repository.js';
import { PrismaServiceRepository } from './database/prisma-service-repository.js';
import { PrismaTimeOffRepository } from './database/prisma-time-off-repository.js';
import { PrismaUserRepository } from './database/prisma-user-repository.js';
import type { AppDependencies } from './http/app.js';
import { BcryptPasswordHasher } from './providers/bcrypt-password-hasher.js';
import { JwtTokenService } from './providers/jwt-token-service.js';
import { SystemClock } from './providers/system-clock.js';

// Composition root: the only place that knows which concrete class backs each port.
// Shared by main.ts and integration tests so both run exactly the same wiring.
export function createAppDependencies(prisma: PrismaClient, env: Env): AppDependencies {
  const userRepository = new PrismaUserRepository(prisma);
  const serviceRepository = new PrismaServiceRepository(prisma);
  const availabilityRepository = new PrismaAvailabilityRepository(prisma);
  const timeOffRepository = new PrismaTimeOffRepository(prisma);
  const clock = new SystemClock();
  const agendaRepositories = {
    userRepository,
    serviceRepository,
    availabilityRepository,
    timeOffRepository,
    appointmentRepository: new PrismaAppointmentRepository(prisma),
  };
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN);

  return {
    checkDatabase: async () => {
      await prisma.$queryRaw`SELECT 1`;
    },
    tokenService,
    registerUser: new RegisterUser(userRepository, passwordHasher, tokenService),
    authenticateUser: new AuthenticateUser(userRepository, passwordHasher, tokenService),
    getUserProfile: new GetUserProfile(userRepository),
    updateUserTimezone: new UpdateUserTimezone(userRepository),
    createService: new CreateService(serviceRepository),
    updateService: new UpdateService(serviceRepository),
    deleteService: new DeleteService(serviceRepository),
    replaceAvailability: new ReplaceAvailability(availabilityRepository),
    createTimeOff: new CreateTimeOff(timeOffRepository, clock),
    deleteTimeOff: new DeleteTimeOff(timeOffRepository),
    listProviders: new ListProviders(userRepository),
    getProviderProfile: new GetProviderProfile(userRepository, serviceRepository),
    getAvailableSlots: new GetAvailableSlots(agendaRepositories, clock),
    createAppointment: new CreateAppointment(agendaRepositories, clock),
    cancelAppointment: new CancelAppointment(agendaRepositories.appointmentRepository, clock),
    listClientAppointments: new ListClientAppointments(agendaRepositories.appointmentRepository),
    listProviderAppointments: new ListProviderAppointments(
      agendaRepositories.appointmentRepository,
    ),
  };
}
