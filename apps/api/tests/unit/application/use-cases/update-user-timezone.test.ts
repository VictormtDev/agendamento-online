import { describe, expect, it } from 'vitest';
import { UpdateUserTimezone } from '../../../../src/application/use-cases/update-user-timezone.js';
import { UserNotFoundError } from '../../../../src/domain/errors/user-not-found-error.js';
import { InMemoryUserRepository } from '../../../in-memory/in-memory-user-repository.js';

describe('UpdateUserTimezone', () => {
  it('should change the timezone and return the profile without the password hash', async () => {
    const userRepository = new InMemoryUserRepository();
    const created = await userRepository.create({
      name: 'Bruno Lima',
      email: 'bruno@example.com',
      passwordHash: 'hashed:secret123',
      role: 'PROVIDER',
      timezone: 'America/Sao_Paulo',
    });

    const profile = await new UpdateUserTimezone(userRepository).execute({
      userId: created.id,
      timezone: 'America/Manaus',
    });

    expect(profile.timezone).toBe('America/Manaus');
    expect(profile).not.toHaveProperty('passwordHash');
  });

  it('should fail when the user no longer exists', async () => {
    const updateUserTimezone = new UpdateUserTimezone(new InMemoryUserRepository());

    await expect(
      updateUserTimezone.execute({ userId: 'missing-id', timezone: 'UTC' }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
