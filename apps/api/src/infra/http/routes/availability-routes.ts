import { Router, type RequestHandler } from 'express';
import type { ReplaceAvailability } from '../../../application/use-cases/replace-availability.js';
import { createReplaceAvailabilityController } from '../controllers/availability-controller.js';

export function createAvailabilityRouter(
  replaceAvailability: ReplaceAvailability,
  providerOnly: RequestHandler[],
): Router {
  const router = Router();
  router.put(
    '/availability',
    providerOnly,
    createReplaceAvailabilityController(replaceAvailability),
  );
  return router;
}
