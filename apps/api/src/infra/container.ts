import { AuthenticateUser } from '../application/use-cases/authenticate-user.js';
import { GetUserProfile } from '../application/use-cases/get-user-profile.js';
import { RegisterUser } from '../application/use-cases/register-user.js';
import type { Env } from '../config/env-schema.js';
import type { PrismaClient } from './database/generated/prisma/client.js';
import { PrismaUserRepository } from './database/prisma-user-repository.js';
import type { AppDependencies } from './http/app.js';
import { BcryptPasswordHasher } from './providers/bcrypt-password-hasher.js';
import { JwtTokenService } from './providers/jwt-token-service.js';

// Composition root: the only place that knows which concrete class backs each port.
// Shared by main.ts and integration tests so both run exactly the same wiring.
export function createAppDependencies(prisma: PrismaClient, env: Env): AppDependencies {
  const userRepository = new PrismaUserRepository(prisma);
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
  };
}
