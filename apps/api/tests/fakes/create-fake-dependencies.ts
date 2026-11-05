import { AuthenticateUser } from '../../src/application/use-cases/authenticate-user.js';
import { CreateService } from '../../src/application/use-cases/create-service.js';
import { DeleteService } from '../../src/application/use-cases/delete-service.js';
import { GetUserProfile } from '../../src/application/use-cases/get-user-profile.js';
import { RegisterUser } from '../../src/application/use-cases/register-user.js';
import { UpdateService } from '../../src/application/use-cases/update-service.js';
import type { AppDependencies } from '../../src/infra/http/app.js';
import { InMemoryServiceRepository } from '../in-memory/in-memory-service-repository.js';
import { InMemoryUserRepository } from '../in-memory/in-memory-user-repository.js';
import { FakePasswordHasher } from './fake-password-hasher.js';
import { FakeTokenService } from './fake-token-service.js';

export function createFakeDependencies(overrides: Partial<AppDependencies> = {}): AppDependencies {
  const userRepository = new InMemoryUserRepository();
  const serviceRepository = new InMemoryServiceRepository();
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
    ...overrides,
  };
}
