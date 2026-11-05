import { toUserProfile, type UserProfile } from '../../domain/entities/user.js';
import { UserNotFoundError } from '../../domain/errors/user-not-found-error.js';
import type { UserRepository } from '../ports/user-repository.js';

export interface UpdateUserTimezoneInput {
  userId: string;
  timezone: string;
}

export class UpdateUserTimezone {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserTimezoneInput): Promise<UserProfile> {
    if (!(await this.userRepository.findById(input.userId))) {
      throw new UserNotFoundError();
    }
    const user = await this.userRepository.updateTimezone(input.userId, input.timezone);
    return toUserProfile(user);
  }
}
