import type { CreateUserData, UserRepository } from '../../application/ports/user-repository.js';
import type { User } from '../../domain/entities/user.js';
import { EmailAlreadyInUseError } from '../../domain/errors/email-already-in-use-error.js';
import { Prisma, type PrismaClient } from './generated/prisma/client.js';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: CreateUserData): Promise<User> {
    try {
      return await this.prisma.user.create({ data });
    } catch (error) {
      // Two simultaneous sign-ups can both pass the use case check; the unique index decides.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new EmailAlreadyInUseError();
      }
      throw error;
    }
  }
}
