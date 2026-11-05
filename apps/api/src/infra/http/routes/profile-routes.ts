import { Router, type RequestHandler } from 'express';
import type { GetUserProfile } from '../../../application/use-cases/get-user-profile.js';
import { createGetProfileController } from '../controllers/profile-controller.js';

export function createProfileRouter(
  getUserProfile: GetUserProfile,
  ensureAuthenticated: RequestHandler,
): Router {
  const router = Router();
  router.get('/me', ensureAuthenticated, createGetProfileController(getUserProfile));
  return router;
}
