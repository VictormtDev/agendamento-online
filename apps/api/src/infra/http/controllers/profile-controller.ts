import type { RequestHandler } from 'express';
import type { GetUserProfile } from '../../../application/use-cases/get-user-profile.js';
import type { UpdateUserTimezone } from '../../../application/use-cases/update-user-timezone.js';
import { requireAuth } from '../middlewares/ensure-authenticated.js';
import { updateProfileBodySchema } from '../schemas/profile-schemas.js';

export function createGetProfileController(getUserProfile: GetUserProfile): RequestHandler {
  return async (request, response) => {
    const { userId } = requireAuth(request);
    const user = await getUserProfile.execute({ userId });
    response.status(200).json({ user });
  };
}

export function createUpdateProfileController(
  updateUserTimezone: UpdateUserTimezone,
): RequestHandler {
  return async (request, response) => {
    const { userId } = requireAuth(request);
    const { timezone } = updateProfileBodySchema.parse(request.body);
    const user = await updateUserTimezone.execute({ userId, timezone });
    response.status(200).json({ user });
  };
}
