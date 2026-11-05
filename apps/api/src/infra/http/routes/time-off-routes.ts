import { Router, type RequestHandler } from 'express';
import type { CreateTimeOff } from '../../../application/use-cases/create-time-off.js';
import type { DeleteTimeOff } from '../../../application/use-cases/delete-time-off.js';
import {
  createCreateTimeOffController,
  createDeleteTimeOffController,
} from '../controllers/time-off-controller.js';

interface TimeOffUseCases {
  createTimeOff: CreateTimeOff;
  deleteTimeOff: DeleteTimeOff;
}

export function createTimeOffRouter(
  useCases: TimeOffUseCases,
  providerOnly: RequestHandler[],
): Router {
  const router = Router();
  router.post('/time-off', providerOnly, createCreateTimeOffController(useCases.createTimeOff));
  router.delete(
    '/time-off/:id',
    providerOnly,
    createDeleteTimeOffController(useCases.deleteTimeOff),
  );
  return router;
}
