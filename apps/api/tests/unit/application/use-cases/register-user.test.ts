import { beforeEach, describe, expect, it } from 'vitest';
import { RegisterUser } from '../../../../src/application/use-cases/register-user.js';
import { EmailAlreadyInUseError } from '../../../../src/domain/errors/email-already-in-use-error.js';
import { FakePasswordHasher } from '../../../fakes/fake-password-hasher.js';
import { FakeTokenService } from '../../../fakes/fake-token-service.js';
import { InMemoryUserRepository } from '../../../in-memory/in-memory-user-repository.js';

const VALID_INPUT = {
  name: 'Ana Souza',
  email: 'ana@example.com',
  password: 'secret123',
  role: 'CLIENT',
} as const;

describe('RegisterUser', () => {
  let userRepository: InMemoryUserRepository;
  let registerUser: RegisterUser;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    registerUser = new RegisterUser(
      userRepository,
      new FakePasswordHasher(),
      new FakeTokenService(),
    );
  });

  it('should create the user and return its profile with an access token', async () => {
    const { user, accessToken } = await registerUser.execute(VALID_INPUT);

    expect(user).toMatchObject({ name: 'Ana Souza', email: 'ana@example.com', role: 'CLIENT' });
    expect(accessToken).toBe(`token:${user.id}:CLIENT`);
    expect(userRepository.users).toHaveLength(1);
  });

  it('should register a provider when the PROVIDER role is chosen', async () => {
    const { user, accessToken } = await registerUser.execute({ ...VALID_INPUT, role: 'PROVIDER' });

    expect(user.role).toBe('PROVIDER');
    expect(accessToken).toBe(`token:${user.id}:PROVIDER`);
  });

  it('should store only the password hash, never the plain password', async () => {
    await registerUser.execute(VALID_INPUT);

    expect(userRepository.users[0]?.passwordHash).toBe('hashed:secret123');
  });

  it('should not expose the password hash in the returned profile', async () => {
    const { user } = await registerUser.execute(VALID_INPUT);

    expect(user).not.toHaveProperty('passwordHash');
  });

  it('should normalize the email to lowercase without surrounding spaces', async () => {
    const { user } = await registerUser.execute({ ...VALID_INPUT, email: '  Ana@Example.COM ' });

    expect(user.email).toBe('ana@example.com');
  });

  it('should not allow two accounts with the same email, ignoring case', async () => {
    await registerUser.execute(VALID_INPUT);

    await expect(
      registerUser.execute({ ...VALID_INPUT, email: 'ANA@example.com' }),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError);
    expect(userRepository.users).toHaveLength(1);
  });
});
