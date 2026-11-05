import { Router, type RequestHandler } from 'express';
import type { CreateService } from '../../../application/use-cases/create-service.js';
import type { DeleteService } from '../../../application/use-cases/delete-service.js';
import type { UpdateService } from '../../../application/use-cases/update-service.js';
import {
  createCreateServiceController,
  createDeleteServiceController,
  createUpdateServiceController,
} from '../controllers/service-controller.js';

interface ServiceUseCases {
  createService: CreateService;
  updateService: UpdateService;
  deleteService: DeleteService;
}

export function createServiceRouter(
  useCases: ServiceUseCases,
  providerOnly: RequestHandler[],
): Router {
  const router = Router();
  router.post('/services', providerOnly, createCreateServiceController(useCases.createService));
  router.patch(
    '/services/:id',
    providerOnly,
    createUpdateServiceController(useCases.updateService),
  );
  router.delete(
    '/services/:id',
    providerOnly,
    createDeleteServiceController(useCases.deleteService),
  );
  return router;
}
