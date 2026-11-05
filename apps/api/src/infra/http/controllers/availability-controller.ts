import type { RequestHandler } from 'express';
import type { GetAvailability } from '../../../application/use-cases/get-availability.js';
import type { ReplaceAvailability } from '../../../application/use-cases/replace-availability.js';
import { requireAuth } from '../middlewares/ensure-authenticated.js';
import { replaceAvailabilityBodySchema } from '../schemas/availability-schemas.js';

export function createGetAvailabilityController(getAvailability: GetAvailability): RequestHandler {
  return async (request, response) => {
    const { userId } = requireAuth(request);
    const availability = await getAvailability.execute({ providerId: userId });
    response.status(200).json({ availability });
  };
}

export function createReplaceAvailabilityController(
  replaceAvailability: ReplaceAvailability,
): RequestHandler {
  return async (request, response) => {
    const { userId } = requireAuth(request);
    const { windows } = replaceAvailabilityBodySchema.parse(request.body);
    const availability = await replaceAvailability.execute({ providerId: userId, windows });
    response.status(200).json({ availability });
  };
}
