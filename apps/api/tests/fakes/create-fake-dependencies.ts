import { AuthenticateUser } from '../../src/application/use-cases/authenticate-user.js';
import { GetUserProfile } from '../../src/application/use-cases/get-user-profile.js';
import { RegisterUser } from '../../src/application/use-cases/register-user.js';
import type { AppDependencies } from '../../src/infra/http/app.js';
import { InMemoryUserRepository } from '../in-memory/in-memory-user-repository.js';
import { FakePasswordHasher } from './fake-password-hasher.js';
import { FakeTokenService } from './fake-token-service.js';

export function createFakeDependencies(overrides: Partial<AppDependencies> = {}): AppDependencies {
  const userRepository = new InMemoryUserRepository();
  const passwordHasher = new FakePasswordHasher();
  const tokenService = new FakeTokenService();

  return {
    checkDatabase: () => Promise.resolve(),
    tokenService,
    registerUser: new RegisterUser(userRepository, passwordHasher, tokenService),
    authenticateUser: new AuthenticateUser(userRepository, passwordHasher, tokenService),
    getUserProfile: new GetUserProfile(userRepository),
    ...overrides,
  };
}
