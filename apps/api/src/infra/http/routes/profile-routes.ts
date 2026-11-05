import { Router, type RequestHandler } from 'express';
import type { GetUserProfile } from '../../../application/use-cases/get-user-profile.js';
import type { UpdateUserTimezone } from '../../../application/use-cases/update-user-timezone.js';
import {
  createGetProfileController,
  createUpdateProfileController,
} from '../controllers/profile-controller.js';

interface ProfileUseCases {
  getUserProfile: GetUserProfile;
  updateUserTimezone: UpdateUserTimezone;
}

export function createProfileRouter(
  useCases: ProfileUseCases,
  ensureAuthenticated: RequestHandler,
): Router {
  const router = Router();
  router.get('/me', ensureAuthenticated, createGetProfileController(useCases.getUserProfile));
  router.patch(
    '/me',
    ensureAuthenticated,
    createUpdateProfileController(useCases.updateUserTimezone),
  );
  return router;
}
