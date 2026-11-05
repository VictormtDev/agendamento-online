import type { TokenPayload, TokenService } from '../../src/application/ports/token-service.js';
import { ROLES, type Role } from '../../src/domain/entities/user.js';

export class FakeTokenService implements TokenService {
  sign(payload: TokenPayload): Promise<string> {
    return Promise.resolve(`token:${payload.userId}:${payload.role}`);
  }

  verify(token: string): Promise<TokenPayload | null> {
    const [prefix, userId, role] = token.split(':');
    if (prefix !== 'token' || !userId || !ROLES.includes(role as Role)) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ userId, role: role as Role });
  }
}
