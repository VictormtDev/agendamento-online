import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../../application/ports/password-hasher.js';

// 10 rounds is ~70ms per hash today: slow enough to resist brute force, fast enough for login.
const BCRYPT_ROUNDS = 10;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
  }

  compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}
