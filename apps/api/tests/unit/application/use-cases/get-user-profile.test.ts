import { describe, expect, it } from 'vitest';
import { GetUserProfile } from '../../../../src/application/use-cases/get-user-profile.js';
import { UserNotFoundError } from '../../../../src/domain/errors/user-not-found-error.js';
import { InMemoryUserRepository } from '../../../in-memory/in-memory-user-repository.js';

describe('GetUserProfile', () => {
  it('should return the profile without the password hash', async () => {
    const userRepository = new InMemoryUserRepository();
    const created = await userRepository.create({
      name: 'Carla Dias',
      email: 'carla@example.com',
      passwordHash: 'hashed:secret123',
      role: 'CLIENT',
      timezone: 'America/Sao_Paulo',
    });

    const profile = await new GetUserProfile(userRepository).execute({ userId: created.id });

    expect(profile).toEqual({
      id: created.id,
      name: 'Carla Dias',
      email: 'carla@example.com',
      role: 'CLIENT',
      timezone: 'America/Sao_Paulo',
      createdAt: created.createdAt,
    });
  });

  it('should fail when the user no longer exists', async () => {
    const getUserProfile = new GetUserProfile(new InMemoryUserRepository());

    await expect(getUserProfile.execute({ userId: 'missing-id' })).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });
});
