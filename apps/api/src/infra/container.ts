import { AuthenticateUser } from '../application/use-cases/authenticate-user.js';
import { CreateService } from '../application/use-cases/create-service.js';
import { DeleteService } from '../application/use-cases/delete-service.js';
import { GetUserProfile } from '../application/use-cases/get-user-profile.js';
import { RegisterUser } from '../application/use-cases/register-user.js';
import { UpdateService } from '../application/use-cases/update-service.js';
import type { Env } from '../config/env-schema.js';
import type { PrismaClient } from './database/generated/prisma/client.js';
import { PrismaServiceRepository } from './database/prisma-service-repository.js';
import { PrismaUserRepository } from './database/prisma-user-repository.js';
import type { AppDependencies } from './http/app.js';
import { BcryptPasswordHasher } from './providers/bcrypt-password-hasher.js';
import { JwtTokenService } from './providers/jwt-token-service.js';

// Composition root: the only place that knows which concrete class backs each port.
// Shared by main.ts and integration tests so both run exactly the same wiring.
export function createAppDependencies(prisma: PrismaClient, env: Env): AppDependencies {
  const userRepository = new PrismaUserRepository(prisma);
  const serviceRepository = new PrismaServiceRepository(prisma);
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
    createService: new CreateService(serviceRepository),
    updateService: new UpdateService(serviceRepository),
    deleteService: new DeleteService(serviceRepository),
  };
}
