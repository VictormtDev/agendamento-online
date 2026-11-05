import type { RequestHandler } from 'express';
import { errorBody } from '../error-body.js';

export type DatabaseCheck = () => Promise<void>;

export function createHealthController(checkDatabase: DatabaseCheck): RequestHandler {
  return async (_request, response) => {
    try {
      await checkDatabase();
    } catch (error) {
      console.error(error);
      response.status(503).json(errorBody('DATABASE_UNAVAILABLE', 'Banco de dados indisponível'));
      return;
    }

    response.status(200).json({ status: 'ok' });
  };
}
