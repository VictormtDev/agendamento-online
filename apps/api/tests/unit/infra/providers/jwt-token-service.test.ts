import { SignJWT } from 'jose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { JwtTokenService } from '../../../../src/infra/providers/jwt-token-service.js';

const SECRET = 'a-test-secret-that-is-at-least-32-chars';
const PAYLOAD = { userId: 'user-1', role: 'CLIENT' } as const;

describe('JwtTokenService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should verify a token it signed and return the original payload', async () => {
    const service = new JwtTokenService(SECRET, '1h');

    const token = await service.sign(PAYLOAD);

    await expect(service.verify(token)).resolves.toEqual(PAYLOAD);
  });

  it('should reject a token signed with a different secret', async () => {
    const otherService = new JwtTokenService('another-secret-also-with-32-characters', '1h');
    const token = await otherService.sign(PAYLOAD);

    await expect(new JwtTokenService(SECRET, '1h').verify(token)).resolves.toBeNull();
  });

  it('should reject an expired token', async () => {
    vi.useFakeTimers();
    const service = new JwtTokenService(SECRET, '1h');
    const token = await service.sign(PAYLOAD);

    vi.advanceTimersByTime(61 * 60 * 1000);

    await expect(service.verify(token)).resolves.toBeNull();
  });

  it('should reject a tampered token', async () => {
    const service = new JwtTokenService(SECRET, '1h');
    const token = await service.sign(PAYLOAD);
    const [header, , signature] = token.split('.') as [string, string, string];
    const forgedPayload = Buffer.from(JSON.stringify({ sub: 'user-1', role: 'PROVIDER' })).toString(
      'base64url',
    );

    await expect(service.verify(`${header}.${forgedPayload}.${signature}`)).resolves.toBeNull();
  });

  it('should reject a correctly signed token carrying an unknown role', async () => {
    const token = await new SignJWT({ role: 'ADMIN' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-1')
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(SECRET));

    await expect(new JwtTokenService(SECRET, '1h').verify(token)).resolves.toBeNull();
  });

  it('should reject garbage that is not a JWT', async () => {
    await expect(new JwtTokenService(SECRET, '1h').verify('not-a-jwt')).resolves.toBeNull();
  });
});
