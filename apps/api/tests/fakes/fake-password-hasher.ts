import type { PasswordHasher } from '../../src/application/ports/password-hasher.js';

// Deterministic and instant, so use case tests don't pay bcrypt's deliberate slowness.
export class FakePasswordHasher implements PasswordHasher {
  hash(plainPassword: string): Promise<string> {
    return Promise.resolve(`hashed:${plainPassword}`);
  }

  compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    return Promise.resolve(passwordHash === `hashed:${plainPassword}`);
  }
}
