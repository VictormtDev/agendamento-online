import { Router, type RequestHandler } from 'express';
import type { CreateService } from '../../../application/use-cases/create-service.js';
import type { DeleteService } from '../../../application/use-cases/delete-service.js';
import type { UpdateService } from '../../../application/use-cases/update-service.js';
import {
  createCreateServiceController,
  createDeleteServiceController,
  createUpdateServiceController,
} from '../controllers/service-controller.js';
import { createEnsureRole } from '../middlewares/ensure-role.js';

interface ServiceUseCases {
  createService: CreateService;
  updateService: UpdateService;
  deleteService: DeleteService;
}

export function createServiceRouter(
  useCases: ServiceUseCases,
  ensureAuthenticated: RequestHandler,
): Router {
  const router = Router();
  // Guards go on each route rather than router.use(): this router is mounted at
  // /api/v1, so a router-level guard would turn every unknown URL into a 401.
  const guards = [ensureAuthenticated, createEnsureRole('PROVIDER')];

  router.post('/services', guards, createCreateServiceController(useCases.createService));
  router.patch('/services/:id', guards, createUpdateServiceController(useCases.updateService));
  router.delete('/services/:id', guards, createDeleteServiceController(useCases.deleteService));
  return router;
}
