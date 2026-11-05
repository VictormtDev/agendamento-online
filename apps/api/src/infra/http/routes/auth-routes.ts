import { Router } from 'express';
import type { AuthenticateUser } from '../../../application/use-cases/authenticate-user.js';
import type { RegisterUser } from '../../../application/use-cases/register-user.js';
import { createLoginController, createRegisterController } from '../controllers/auth-controller.js';

export function createAuthRouter(
  registerUser: RegisterUser,
  authenticateUser: AuthenticateUser,
): Router {
  const router = Router();
  router.post('/auth/register', createRegisterController(registerUser));
  router.post('/auth/login', createLoginController(authenticateUser));
  return router;
}
