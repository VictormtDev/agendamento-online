import { Router, type RequestHandler } from 'express';
import type { GetAvailability } from '../../../application/use-cases/get-availability.js';
import type { ReplaceAvailability } from '../../../application/use-cases/replace-availability.js';
import {
  createGetAvailabilityController,
  createReplaceAvailabilityController,
} from '../controllers/availability-controller.js';

interface AvailabilityUseCases {
  getAvailability: GetAvailability;
  replaceAvailability: ReplaceAvailability;
}

export function createAvailabilityRouter(
  useCases: AvailabilityUseCases,
  providerOnly: RequestHandler[],
): Router {
  const router = Router();
  router.get(
    '/availability',
    providerOnly,
    createGetAvailabilityController(useCases.getAvailability),
  );
  router.put(
    '/availability',
    providerOnly,
    createReplaceAvailabilityController(useCases.replaceAvailability),
  );
  return router;
}
