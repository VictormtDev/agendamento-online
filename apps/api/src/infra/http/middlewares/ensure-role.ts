import type { RequestHandler } from 'express';
import type { Role } from '../../../domain/entities/user.js';
import { errorBody } from '../error-body.js';
import { requireAuth } from './ensure-authenticated.js';

// Must run after ensureAuthenticated: authentication answers "who are you?" (401),
// this answers "are you allowed here?" (403).
export function createEnsureRole(...allowedRoles: [Role, ...Role[]]): RequestHandler {
  return (request, response, next) => {
    const { role } = requireAuth(request);
    if (!allowedRoles.includes(role)) {
      response
        .status(403)
        .json(errorBody('FORBIDDEN', 'Você não tem permissão para acessar este recurso'));
      return;
    }
    next();
  };
}
