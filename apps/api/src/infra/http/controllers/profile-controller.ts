import type { RequestHandler } from 'express';
import type { GetUserProfile } from '../../../application/use-cases/get-user-profile.js';
import { requireAuth } from '../middlewares/ensure-authenticated.js';

export function createGetProfileController(getUserProfile: GetUserProfile): RequestHandler {
  return async (request, response) => {
    const { userId } = requireAuth(request);
    const user = await getUserProfile.execute({ userId });
    response.status(200).json({ user });
  };
}
