import { describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from '../../../../src/infra/providers/bcrypt-password-hasher.js';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();

  it('should match the original password against its hash', async () => {
    const hash = await hasher.hash('secret123');

    expect(hash).not.toContain('secret123');
    await expect(hasher.compare('secret123', hash)).resolves.toBe(true);
  });

  it('should not match a different password', async () => {
    const hash = await hasher.hash('secret123');

    await expect(hasher.compare('secret124', hash)).resolves.toBe(false);
  });

  it('should produce a different hash each time thanks to the random salt', async () => {
    const [first, second] = await Promise.all([hasher.hash('secret123'), hasher.hash('secret123')]);

    expect(first).not.toBe(second);
  });
});
