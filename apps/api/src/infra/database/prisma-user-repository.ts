import type { Pagination } from '../../application/pagination.js';
import type {
  CreateUserData,
  ProviderSummary,
  UserRepository,
} from '../../application/ports/user-repository.js';
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

  updateTimezone(id: string, timezone: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { timezone } });
  }

  async listBookableProviders({
    page,
    perPage,
  }: Pagination): Promise<{ items: ProviderSummary[]; total: number }> {
    const where = {
      role: 'PROVIDER',
      services: { some: { active: true } },
    } satisfies Prisma.UserWhereInput;
    // Same transaction so the total always matches the page; the id breaks ties
    // between equal names, keeping pages stable.
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          name: true,
          _count: { select: { services: { where: { active: true } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        activeServiceCount: row._count.services,
      })),
      total,
    };
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
