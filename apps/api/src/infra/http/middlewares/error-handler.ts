import type { ErrorRequestHandler } from 'express';
import { errorBody } from '../error-body.js';

// Single place where errors become HTTP responses. Anything not explicitly mapped
// is treated as a bug: logged in full, but returned to the client without internals.
export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  console.error(error);
  response.status(500).json(errorBody('INTERNAL_ERROR', 'Erro interno do servidor'));
};
