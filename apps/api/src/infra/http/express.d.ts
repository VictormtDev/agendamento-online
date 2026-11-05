import type { TokenPayload } from '../../application/ports/token-service.js';

declare global {
  namespace Express {
    interface Request {
      /** Set by ensureAuthenticated; read it through requireAuth(). */
      auth?: TokenPayload;
    }
  }
}
