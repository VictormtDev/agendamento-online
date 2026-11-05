import { AuthenticateUser } from '../../src/application/use-cases/authenticate-user.js';
import { CreateTimeOff } from '../../src/application/use-cases/create-time-off.js';
import { CreateService } from '../../src/application/use-cases/create-service.js';
import { DeleteService } from '../../src/application/use-cases/delete-service.js';
import { DeleteTimeOff } from '../../src/application/use-cases/delete-time-off.js';
import { GetUserProfile } from '../../src/application/use-cases/get-user-profile.js';
import { RegisterUser } from '../../src/application/use-cases/register-user.js';
import { ReplaceAvailability } from '../../src/application/use-cases/replace-availability.js';
import { UpdateService } from '../../src/application/use-cases/update-service.js';
import type { AppDependencies } from '../../src/infra/http/app.js';
import { InMemoryAvailabilityRepository } from '../in-memory/in-memory-availability-repository.js';
import { InMemoryServiceRepository } from '../in-memory/in-memory-service-repository.js';
import { InMemoryTimeOffRepository } from '../in-memory/in-memory-time-off-repository.js';
import { InMemoryUserRepository } from '../in-memory/in-memory-user-repository.js';
import { FakeClock } from './fake-clock.js';
import { FakePasswordHasher } from './fake-password-hasher.js';
import { FakeTokenService } from './fake-token-service.js';

export function createFakeDependencies(overrides: Partial<AppDependencies> = {}): AppDependencies {
  const userRepository = new InMemoryUserRepository();
  const serviceRepository = new InMemoryServiceRepository();
  const availabilityRepository = new InMemoryAvailabilityRepository();
  const timeOffRepository = new InMemoryTimeOffRepository();
  const passwordHasher = new FakePasswordHasher();
  const tokenService = new FakeTokenService();

  return {
    checkDatabase: () => Promise.resolve(),
    tokenService,
    registerUser: new RegisterUser(userRepository, passwordHasher, tokenService),
    authenticateUser: new AuthenticateUser(userRepository, passwordHasher, tokenService),
    getUserProfile: new GetUserProfile(userRepository),
    createService: new CreateService(serviceRepository),
    updateService: new UpdateService(serviceRepository),
    deleteService: new DeleteService(serviceRepository),
    replaceAvailability: new ReplaceAvailability(availabilityRepository),
    createTimeOff: new CreateTimeOff(timeOffRepository, new FakeClock()),
    deleteTimeOff: new DeleteTimeOff(timeOffRepository),
    ...overrides,
  };
}
