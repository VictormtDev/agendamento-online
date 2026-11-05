import type { Role, User } from '../../domain/entities/user.js';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  /** @throws EmailAlreadyInUseError when the email is taken, even under concurrent inserts. */
  create(data: CreateUserData): Promise<User>;
}
