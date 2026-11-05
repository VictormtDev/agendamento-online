import { randomUUID } from 'node:crypto';
import type {
  CreateUserData,
  UserRepository,
} from '../../src/application/ports/user-repository.js';
import type { User } from '../../src/domain/entities/user.js';
import { EmailAlreadyInUseError } from '../../src/domain/errors/email-already-in-use-error.js';

export class InMemoryUserRepository implements UserRepository {
  readonly users: User[] = [];

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

  updateTimezone(id: string, timezone: string): Promise<User> {
    const user = this.users.find((item) => item.id === id);
    if (!user) {
      return Promise.reject(new Error(`User ${id} not found`));
    }
    user.timezone = timezone;
    return Promise.resolve(user);
  }
}
