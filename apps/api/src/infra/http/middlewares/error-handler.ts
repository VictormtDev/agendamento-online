import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../../../domain/errors/domain-error.js';
import { errorBody } from '../error-body.js';

const DOMAIN_ERROR_STATUS: Record<string, number> = {
  EMAIL_ALREADY_IN_USE: 409,
  INVALID_CREDENTIALS: 401,
  USER_NOT_FOUND: 404,
  SERVICE_NOT_FOUND: 404,
  PROVIDER_NOT_FOUND: 404,
  TIME_OFF_NOT_FOUND: 404,
  INVALID_TIME_OFF_PERIOD: 400,
};
// Unmapped domain errors are business rule violations, which the API contract defines as 409.
const DEFAULT_DOMAIN_ERROR_STATUS = 409;

function isMalformedJsonError(error: unknown): boolean {
  return error instanceof SyntaxError && 'type' in error && error.type === 'entity.parse.failed';
}

// Single place where errors become HTTP responses. Anything not explicitly mapped
// is treated as a bug: logged in full, but returned to the client without internals.
export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof DomainError) {
    const status = DOMAIN_ERROR_STATUS[error.code] ?? DEFAULT_DOMAIN_ERROR_STATUS;
    response.status(status).json(errorBody(error.code, error.message));
    return;
  }

  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    response.status(400).json(errorBody('VALIDATION_ERROR', 'Dados inválidos', { issues }));
    return;
  }

  if (isMalformedJsonError(error)) {
    response
      .status(400)
      .json(errorBody('MALFORMED_JSON', 'Corpo da requisição não é um JSON válido'));
    return;
  }

  console.error(error);
  response.status(500).json(errorBody('INTERNAL_ERROR', 'Erro interno do servidor'));
};
