import type { RequestHandler } from 'express';
import { errorBody } from '../error-body.js';

export const notFound: RequestHandler = (_request, response) => {
  response.status(404).json(errorBody('ROUTE_NOT_FOUND', 'Rota não encontrada'));
};
