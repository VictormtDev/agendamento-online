import type { RequestHandler } from 'express';
import type { CreateService } from '../../../application/use-cases/create-service.js';
import type { DeleteService } from '../../../application/use-cases/delete-service.js';
import type { UpdateService } from '../../../application/use-cases/update-service.js';
import { requireAuth } from '../middlewares/ensure-authenticated.js';
import { idParamsSchema } from '../schemas/id-params-schema.js';
import { createServiceBodySchema, updateServiceBodySchema } from '../schemas/service-schemas.js';

// The provider always comes from the token, never from the body, so nobody can
// create or edit services on behalf of another provider.
export function createCreateServiceController(createService: CreateService): RequestHandler {
  return async (request, response) => {
    const { userId } = requireAuth(request);
    const body = createServiceBodySchema.parse(request.body);
    const service = await createService.execute({ ...body, providerId: userId });
    response.status(201).json({ service });
  };
}

export function createUpdateServiceController(updateService: UpdateService): RequestHandler {
  return async (request, response) => {
    const { userId } = requireAuth(request);
    const { id } = idParamsSchema.parse(request.params);
    const changes = updateServiceBodySchema.parse(request.body);
    const service = await updateService.execute({ providerId: userId, serviceId: id, changes });
    response.status(200).json({ service });
  };
}

export function createDeleteServiceController(deleteService: DeleteService): RequestHandler {
  return async (request, response) => {
    const { userId } = requireAuth(request);
    const { id } = idParamsSchema.parse(request.params);
    await deleteService.execute({ providerId: userId, serviceId: id });
    response.status(204).end();
  };
}
