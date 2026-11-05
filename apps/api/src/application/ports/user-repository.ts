import type { Role, User } from '../../domain/entities/user.js';
import type { Pagination } from '../pagination.js';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  timezone: string;
}

export interface ProviderSummary {
  id: string;
  name: string;
  activeServiceCount: number;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  /** @throws EmailAlreadyInUseError when the email is taken, even under concurrent inserts. */
  create(data: CreateUserData): Promise<User>;
  updateTimezone(id: string, timezone: string): Promise<User>;
  /** Only providers with at least one active service, ordered by name. */
  listBookableProviders(
    pagination: Pagination,
  ): Promise<{ items: ProviderSummary[]; total: number }>;
}
