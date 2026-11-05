import { Router } from 'express';
import type { GetAvailableSlots } from '../../../application/use-cases/get-available-slots.js';
import { createGetAvailableSlotsController } from '../controllers/slot-controller.js';

// Public on purpose: clients browse free slots before signing in.
export function createProviderRouter(getAvailableSlots: GetAvailableSlots): Router {
  const router = Router();
  router.get('/providers/:id/slots', createGetAvailableSlotsController(getAvailableSlots));
  return router;
}
