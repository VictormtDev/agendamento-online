import { AuthenticateUser } from '../../src/application/use-cases/authenticate-user.js';
import { CancelAppointment } from '../../src/application/use-cases/cancel-appointment.js';
import { CreateAppointment } from '../../src/application/use-cases/create-appointment.js';
import { CreateTimeOff } from '../../src/application/use-cases/create-time-off.js';
import { CreateService } from '../../src/application/use-cases/create-service.js';
import { DeleteService } from '../../src/application/use-cases/delete-service.js';
import { DeleteTimeOff } from '../../src/application/use-cases/delete-time-off.js';
import { GetAvailability } from '../../src/application/use-cases/get-availability.js';
import { GetAvailableSlots } from '../../src/application/use-cases/get-available-slots.js';
import { GetProviderProfile } from '../../src/application/use-cases/get-provider-profile.js';
import { GetUserProfile } from '../../src/application/use-cases/get-user-profile.js';
import { ListClientAppointments } from '../../src/application/use-cases/list-client-appointments.js';
import { ListProviderAppointments } from '../../src/application/use-cases/list-provider-appointments.js';
import { ListProviders } from '../../src/application/use-cases/list-providers.js';
import { ListUpcomingTimeOffs } from '../../src/application/use-cases/list-upcoming-time-offs.js';
import { RegisterUser } from '../../src/application/use-cases/register-user.js';
import { ReplaceAvailability } from '../../src/application/use-cases/replace-availability.js';
import { UpdateService } from '../../src/application/use-cases/update-service.js';
import { UpdateUserTimezone } from '../../src/application/use-cases/update-user-timezone.js';
import type { AppDependencies } from '../../src/infra/http/app.js';
import { InMemoryAppointmentRepository } from '../in-memory/in-memory-appointment-repository.js';
import { InMemoryAvailabilityRepository } from '../in-memory/in-memory-availability-repository.js';
import { InMemoryServiceRepository } from '../in-memory/in-memory-service-repository.js';
import { InMemoryTimeOffRepository } from '../in-memory/in-memory-time-off-repository.js';
import { InMemoryUserRepository } from '../in-memory/in-memory-user-repository.js';
import { FakeClock } from './fake-clock.js';
import { FakePasswordHasher } from './fake-password-hasher.js';
import { FakeTokenService } from './fake-token-service.js';

export function createFakeDependencies(overrides: Partial<AppDependencies> = {}): AppDependencies {
  const serviceRepository = new InMemoryServiceRepository();
  const userRepository = new InMemoryUserRepository(serviceRepository);
  const availabilityRepository = new InMemoryAvailabilityRepository();
  const timeOffRepository = new InMemoryTimeOffRepository();
  const clock = new FakeClock();
  const agendaRepositories = {
    userRepository,
    serviceRepository,
    availabilityRepository,
    timeOffRepository,
    appointmentRepository: new InMemoryAppointmentRepository(userRepository, serviceRepository),
  };
  const passwordHasher = new FakePasswordHasher();
  const tokenService = new FakeTokenService();

  return {
    checkDatabase: () => Promise.resolve(),
    tokenService,
    registerUser: new RegisterUser(userRepository, passwordHasher, tokenService),
    authenticateUser: new AuthenticateUser(userRepository, passwordHasher, tokenService),
    getUserProfile: new GetUserProfile(userRepository),
    updateUserTimezone: new UpdateUserTimezone(userRepository),
    createService: new CreateService(serviceRepository),
    updateService: new UpdateService(serviceRepository),
    deleteService: new DeleteService(serviceRepository),
    getAvailability: new GetAvailability(availabilityRepository),
    replaceAvailability: new ReplaceAvailability(availabilityRepository),
    listUpcomingTimeOffs: new ListUpcomingTimeOffs(timeOffRepository, clock),
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
    ...overrides,
  };
}
