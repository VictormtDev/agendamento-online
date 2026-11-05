import type { RequestHandler } from 'express';
import type { ReplaceAvailability } from '../../../application/use-cases/replace-availability.js';
import { requireAuth } from '../middlewares/ensure-authenticated.js';
import { replaceAvailabilityBodySchema } from '../schemas/availability-schemas.js';

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
