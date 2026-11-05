import { Router } from 'express';
import type { GetAvailableSlots } from '../../../application/use-cases/get-available-slots.js';
import type { GetProviderProfile } from '../../../application/use-cases/get-provider-profile.js';
import type { ListProviders } from '../../../application/use-cases/list-providers.js';
import {
  createGetProviderProfileController,
  createListProvidersController,
} from '../controllers/provider-controller.js';
import { createGetAvailableSlotsController } from '../controllers/slot-controller.js';

interface ProviderUseCases {
  listProviders: ListProviders;
  getProviderProfile: GetProviderProfile;
  getAvailableSlots: GetAvailableSlots;
}

// Public on purpose: clients browse providers and free slots before signing in.
export function createProviderRouter(useCases: ProviderUseCases): Router {
  const router = Router();
  router.get('/providers', createListProvidersController(useCases.listProviders));
  router.get('/providers/:id', createGetProviderProfileController(useCases.getProviderProfile));
  router.get('/providers/:id/slots', createGetAvailableSlotsController(useCases.getAvailableSlots));
  return router;
}
