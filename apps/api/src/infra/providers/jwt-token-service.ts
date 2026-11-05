import { jwtVerify, SignJWT } from 'jose';
import type { TokenPayload, TokenService } from '../../application/ports/token-service.js';
import { ROLES, type Role } from '../../domain/entities/user.js';

const ALGORITHM = 'HS256';

function isRole(value: unknown): value is Role {
  return ROLES.includes(value as Role);
}

export class JwtTokenService implements TokenService {
  private readonly secret: Uint8Array;

  constructor(
    secret: string,
    private readonly expiresIn: string,
  ) {
    this.secret = new TextEncoder().encode(secret);
  }

  sign(payload: TokenPayload): Promise<string> {
    return new SignJWT({ role: payload.role })
      .setProtectedHeader({ alg: ALGORITHM })
      .setSubject(payload.userId)
      .setIssuedAt()
      .setExpirationTime(this.expiresIn)
      .sign(this.secret);
  }

  async verify(token: string): Promise<TokenPayload | null> {
    try {
      // Pinning the algorithm blocks "alg: none" and algorithm-confusion attacks.
      const { payload } = await jwtVerify(token, this.secret, { algorithms: [ALGORITHM] });
      if (typeof payload.sub !== 'string' || !isRole(payload.role)) {
        return null;
      }
      return { userId: payload.sub, role: payload.role };
    } catch {
      return null;
    }
  }
}
