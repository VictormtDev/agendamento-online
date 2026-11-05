import type { Role } from '../../domain/entities/user.js';

export interface TokenPayload {
  userId: string;
  role: Role;
}

export interface TokenService {
  sign(payload: TokenPayload): Promise<string>;
  /** Returns null for any invalid, tampered or expired token. */
  verify(token: string): Promise<TokenPayload | null>;
}
