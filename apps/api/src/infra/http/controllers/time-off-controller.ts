import type { RequestHandler } from 'express';
import type { CreateTimeOff } from '../../../application/use-cases/create-time-off.js';
import type { DeleteTimeOff } from '../../../application/use-cases/delete-time-off.js';
import type { ListUpcomingTimeOffs } from '../../../application/use-cases/list-upcoming-time-offs.js';
import { requireAuth } from '../middlewares/ensure-authenticated.js';
import { idParamsSchema } from '../schemas/id-params-schema.js';
import { createTimeOffBodySchema } from '../schemas/time-off-schemas.js';

export function createListTimeOffsController(
  listUpcomingTimeOffs: ListUpcomingTimeOffs,
): RequestHandler {
  return async (request, response) => {
    const { userId } = requireAuth(request);
    const timeOffs = await listUpcomingTimeOffs.execute({ providerId: userId });
    response.status(200).json({ timeOffs });
  };
}

export function createCreateTimeOffController(createTimeOff: CreateTimeOff): RequestHandler {
  return async (request, response) => {
    const { userId } = requireAuth(request);
    const body = createTimeOffBodySchema.parse(request.body);
    const timeOff = await createTimeOff.execute({ ...body, providerId: userId });
    response.status(201).json({ timeOff });
  };
}

export function createDeleteTimeOffController(deleteTimeOff: DeleteTimeOff): RequestHandler {
  return async (request, response) => {
    const { userId } = requireAuth(request);
    const { id } = idParamsSchema.parse(request.params);
    await deleteTimeOff.execute({ providerId: userId, timeOffId: id });
    response.status(204).end();
  };
}
