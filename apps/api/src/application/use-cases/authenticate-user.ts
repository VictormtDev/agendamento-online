import { normalizeEmail, toUserProfile, type UserProfile } from '../../domain/entities/user.js';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials-error.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { TokenService } from '../ports/token-service.js';
import type { UserRepository } from '../ports/user-repository.js';

export interface AuthenticateUserInput {
  email: string;
  password: string;
}

export interface AuthenticateUserOutput {
  user: UserProfile;
  accessToken: string;
}

export class AuthenticateUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
    const user = await this.userRepository.findByEmail(normalizeEmail(input.email));
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const accessToken = await this.tokenService.sign({ userId: user.id, role: user.role });
    return { user: toUserProfile(user), accessToken };
  }
}
