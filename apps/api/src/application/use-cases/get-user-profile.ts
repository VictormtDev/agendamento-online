import { toUserProfile, type UserProfile } from '../../domain/entities/user.js';
import { UserNotFoundError } from '../../domain/errors/user-not-found-error.js';
import type { UserRepository } from '../ports/user-repository.js';

export interface GetUserProfileInput {
  userId: string;
}

export class GetUserProfile {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetUserProfileInput): Promise<UserProfile> {
    // A valid token can outlive its user (e.g. account removed), so absence is not a bug here.
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    return toUserProfile(user);
  }
}
