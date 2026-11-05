import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEnsureAuthenticated } from '../../../../../src/infra/http/middlewares/ensure-authenticated.js';
import { createEnsureRole } from '../../../../../src/infra/http/middlewares/ensure-role.js';
import { errorHandler } from '../../../../../src/infra/http/middlewares/error-handler.js';
import { FakeTokenService } from '../../../../fakes/fake-token-service.js';

const ok: RequestHandler = (_request, response) => {
  response.status(200).json({ ok: true });
};

// No production route requires a role yet, so the middleware is exercised on a
// throwaway app wired the same way real routes will be: authenticate, then authorize.
function createProtectedApp() {
  const app = express();
  const ensureAuthenticated = createEnsureAuthenticated(new FakeTokenService());
  app.get('/provider-only', ensureAuthenticated, createEnsureRole('PROVIDER'), ok);
  app.get('/any-role', ensureAuthenticated, createEnsureRole('CLIENT', 'PROVIDER'), ok);
  app.get('/missing-authentication', createEnsureRole('PROVIDER'), ok);
  app.use(errorHandler);
  return app;
}

function asUser(role: string) {
  return { Authorization: `Bearer token:user-1:${role}` };
}

describe('ensureRole', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should let a user with the required role through', async () => {
    const response = await request(createProtectedApp())
      .get('/provider-only')
      .set(asUser('PROVIDER'));

    expect(response.status).toBe(200);
  });

  it('should return 403 in the standard error format for a user without the required role', async () => {
    const response = await request(createProtectedApp())
      .get('/provider-only')
      .set(asUser('CLIENT'));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: {
        code: 'FORBIDDEN',
        message: 'Você não tem permissão para acessar este recurso',
        details: {},
      },
    });
  });

  it.each(['CLIENT', 'PROVIDER'])(
    'should accept any of several allowed roles (%s)',
    async (role) => {
      const response = await request(createProtectedApp()).get('/any-role').set(asUser(role));

      expect(response.status).toBe(200);
    },
  );

  it('should return 401, not 403, when the request is not authenticated', async () => {
    const response = await request(createProtectedApp()).get('/provider-only');

    expect(response.status).toBe(401);
  });

  it('should fail loudly with 500 when mounted without ensureAuthenticated', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await request(createProtectedApp()).get('/missing-authentication');

    expect(response.status).toBe(500);
  });
});
