import {
  normalizeEmail,
  toUserProfile,
  type Role,
  type UserProfile,
} from '../../domain/entities/user.js';
import { EmailAlreadyInUseError } from '../../domain/errors/email-already-in-use-error.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { TokenService } from '../ports/token-service.js';
import type { UserRepository } from '../ports/user-repository.js';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  timezone: string;
}

export interface RegisterUserOutput {
  user: UserProfile;
  accessToken: string;
}

export class RegisterUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const email = normalizeEmail(input.email);

    // Early check for a friendly error; the unique index still guards concurrent requests.
    if (await this.userRepository.findByEmail(email)) {
      throw new EmailAlreadyInUseError();
    }

    const user = await this.userRepository.create({
      name: input.name.trim(),
      email,
      passwordHash: await this.passwordHasher.hash(input.password),
      role: input.role,
      timezone: input.timezone,
    });

    const accessToken = await this.tokenService.sign({ userId: user.id, role: user.role });
    return { user: toUserProfile(user), accessToken };
  }
}
