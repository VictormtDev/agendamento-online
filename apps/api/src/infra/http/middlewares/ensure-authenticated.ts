import type { Request, RequestHandler } from 'express';
import type { TokenPayload, TokenService } from '../../../application/ports/token-service.js';
import { errorBody } from '../error-body.js';

const BEARER_PREFIX = 'Bearer ';

export function createEnsureAuthenticated(tokenService: TokenService): RequestHandler {
  return async (request, response, next) => {
    const header = request.headers.authorization;
    if (!header?.startsWith(BEARER_PREFIX)) {
      response.status(401).json(errorBody('UNAUTHENTICATED', 'Autenticação necessária'));
      return;
    }

    const payload = await tokenService.verify(header.slice(BEARER_PREFIX.length));
    if (!payload) {
      response.status(401).json(errorBody('INVALID_TOKEN', 'Token inválido ou expirado'));
      return;
    }

    request.auth = payload;
    next();
  };
}

// Throws instead of returning undefined: reaching a protected handler without the
// middleware is a wiring bug, and should fail loudly as a 500 rather than leak data.
export function requireAuth(request: Request): TokenPayload {
  if (!request.auth) {
    throw new Error('requireAuth called on a route without ensureAuthenticated');
  }
  return request.auth;
}
