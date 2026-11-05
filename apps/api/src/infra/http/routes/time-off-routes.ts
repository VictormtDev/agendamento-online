import { Router, type RequestHandler } from 'express';
import type { CreateTimeOff } from '../../../application/use-cases/create-time-off.js';
import type { DeleteTimeOff } from '../../../application/use-cases/delete-time-off.js';
import type { ListUpcomingTimeOffs } from '../../../application/use-cases/list-upcoming-time-offs.js';
import {
  createCreateTimeOffController,
  createDeleteTimeOffController,
  createListTimeOffsController,
} from '../controllers/time-off-controller.js';

interface TimeOffUseCases {
  createTimeOff: CreateTimeOff;
  deleteTimeOff: DeleteTimeOff;
  listUpcomingTimeOffs: ListUpcomingTimeOffs;
}

export function createTimeOffRouter(
  useCases: TimeOffUseCases,
  providerOnly: RequestHandler[],
): Router {
  const router = Router();
  router.get(
    '/time-off',
    providerOnly,
    createListTimeOffsController(useCases.listUpcomingTimeOffs),
  );
  router.post('/time-off', providerOnly, createCreateTimeOffController(useCases.createTimeOff));
  router.delete(
    '/time-off/:id',
    providerOnly,
    createDeleteTimeOffController(useCases.deleteTimeOff),
  );
  return router;
}
