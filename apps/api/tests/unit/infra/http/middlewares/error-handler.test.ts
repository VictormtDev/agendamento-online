import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';
import { EmailAlreadyInUseError } from '../../../../../src/domain/errors/email-already-in-use-error.js';
import { InvalidCredentialsError } from '../../../../../src/domain/errors/invalid-credentials-error.js';
import { UserNotFoundError } from '../../../../../src/domain/errors/user-not-found-error.js';
import { errorHandler } from '../../../../../src/infra/http/middlewares/error-handler.js';

class UnmappedRuleError extends DomainError {
  readonly code = 'SOME_BUSINESS_RULE';
}

// The handler is mounted on a throwaway app so each error type can be thrown directly,
// both sync and async (Express 5 forwards rejected promises).
function createAppThatThrows() {
  const app = express();
  app.use(express.json());
  app.post('/json', (_request, response) => {
    response.sendStatus(204);
  });
  app.get('/email-in-use', () => {
    throw new EmailAlreadyInUseError();
  });
  app.get('/invalid-credentials', () => {
    throw new InvalidCredentialsError();
  });
  app.get('/user-not-found', () => {
    throw new UserNotFoundError();
  });
  app.get('/unmapped-rule', () => {
    throw new UnmappedRuleError('Regra violada');
  });
  app.get('/validation', () => {
    z.object({ email: z.email() }).parse({ email: 'not-an-email' });
  });
  app.get('/sync', () => {
    throw new Error('secret database password leaked in message');
  });
  app.get('/async', () => Promise.reject(new Error('async failure')));
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['/sync', '/async'])(
    'should return 500 in the standard error format for unexpected errors (%s)',
    async (path) => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const response = await request(createAppThatThrows()).get(path);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor', details: {} },
      });
    },
  );

  it('should not leak the original error message to the client', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await request(createAppThatThrows()).get('/sync');

    expect(response.text).not.toContain('secret');
  });

  it('should log the original error for debugging', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await request(createAppThatThrows()).get('/sync');

    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'secret database password leaked in message' }),
    );
  });

  it.each([
    ['/email-in-use', 409, 'EMAIL_ALREADY_IN_USE'],
    ['/invalid-credentials', 401, 'INVALID_CREDENTIALS'],
    ['/user-not-found', 404, 'USER_NOT_FOUND'],
    ['/unmapped-rule', 409, 'SOME_BUSINESS_RULE'],
  ])('should map the domain error at %s to HTTP %i with its code', async (path, status, code) => {
    const response = await request(createAppThatThrows()).get(path);

    expect(response.status).toBe(status);
    expect(response.body.error.code).toBe(code);
  });

  it('should return 400 with the invalid fields when validation fails', async () => {
    const response = await request(createAppThatThrows()).get('/validation');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.issues).toEqual([
      { path: 'email', message: expect.any(String) },
    ]);
  });

  it('should return 400 when the request body is not valid JSON', async () => {
    const response = await request(createAppThatThrows())
      .post('/json')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('MALFORMED_JSON');
  });
});
