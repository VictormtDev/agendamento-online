import { beforeEach, describe, expect, it } from 'vitest';
import { AuthenticateUser } from '../../../../src/application/use-cases/authenticate-user.js';
import { InvalidCredentialsError } from '../../../../src/domain/errors/invalid-credentials-error.js';
import { FakePasswordHasher } from '../../../fakes/fake-password-hasher.js';
import { FakeTokenService } from '../../../fakes/fake-token-service.js';
import { InMemoryUserRepository } from '../../../in-memory/in-memory-user-repository.js';

describe('AuthenticateUser', () => {
  let userRepository: InMemoryUserRepository;
  let authenticateUser: AuthenticateUser;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    authenticateUser = new AuthenticateUser(
      userRepository,
      new FakePasswordHasher(),
      new FakeTokenService(),
    );
    await userRepository.create({
      name: 'Bruno Lima',
      email: 'bruno@example.com',
      passwordHash: 'hashed:secret123',
      role: 'PROVIDER',
    });
  });

  it('should return the profile and an access token for valid credentials', async () => {
    const { user, accessToken } = await authenticateUser.execute({
      email: 'bruno@example.com',
      password: 'secret123',
    });

    expect(user).toMatchObject({ email: 'bruno@example.com', role: 'PROVIDER' });
    expect(user).not.toHaveProperty('passwordHash');
    expect(accessToken).toBe(`token:${user.id}:PROVIDER`);
  });

  it('should accept the email in any case', async () => {
    const { user } = await authenticateUser.execute({
      email: ' BRUNO@Example.com ',
      password: 'secret123',
    });

    expect(user.email).toBe('bruno@example.com');
  });

  it('should reject a wrong password', async () => {
    await expect(
      authenticateUser.execute({ email: 'bruno@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('should reject an unknown email with the same error as a wrong password', async () => {
    await expect(
      authenticateUser.execute({ email: 'nobody@example.com', password: 'secret123' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
