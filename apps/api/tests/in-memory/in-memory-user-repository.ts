import { randomUUID } from 'node:crypto';
import type { Pagination } from '../../src/application/pagination.js';
import type {
  CreateUserData,
  ProviderSummary,
  UserRepository,
} from '../../src/application/ports/user-repository.js';
import type { User } from '../../src/domain/entities/user.js';
import { EmailAlreadyInUseError } from '../../src/domain/errors/email-already-in-use-error.js';
import { InMemoryServiceRepository } from './in-memory-service-repository.js';

export class InMemoryUserRepository implements UserRepository {
  readonly users: User[] = [];

  // The provider listing counts active services, as the real repository does with a join.
  constructor(private readonly serviceRepository = new InMemoryServiceRepository()) {}

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.find((user) => user.id === id) ?? null);
  }

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(this.users.find((user) => user.email === email) ?? null);
  }

  // Mirrors the unique index of the real database, as promised by the port contract.
  create(data: CreateUserData): Promise<User> {
    if (this.users.some((user) => user.email === data.email)) {
      return Promise.reject(new EmailAlreadyInUseError());
    }
    const user: User = { id: randomUUID(), createdAt: new Date(), ...data };
    this.users.push(user);
    return Promise.resolve(user);
  }

  listBookableProviders({
    page,
    perPage,
  }: Pagination): Promise<{ items: ProviderSummary[]; total: number }> {
    const matching = this.users
      .filter((user) => user.role === 'PROVIDER')
      .map((user) => ({
        id: user.id,
        name: user.name,
        activeServiceCount: this.serviceRepository.services.filter(
          (service) => service.providerId === user.id && service.active,
        ).length,
      }))
      .filter((provider) => provider.activeServiceCount > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
    const offset = (page - 1) * perPage;
    return Promise.resolve({
      items: matching.slice(offset, offset + perPage),
      total: matching.length,
    });
  }

  updateTimezone(id: string, timezone: string): Promise<User> {
    const user = this.users.find((item) => item.id === id);
    if (!user) {
      return Promise.reject(new Error(`User ${id} not found`));
    }
    user.timezone = timezone;
    return Promise.resolve(user);
  }
}
