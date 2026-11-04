import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../../../../src/infra/http/middlewares/error-handler.js';

// No production route throws yet, so the handler is mounted on a throwaway app
// to exercise both sync and async failures (Express 5 forwards rejected promises).
function createAppThatThrows() {
  const app = express();
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
});
