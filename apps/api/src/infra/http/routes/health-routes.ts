import { Router } from 'express';
import { createHealthController, type DatabaseCheck } from '../controllers/health-controller.js';

export function createHealthRouter(checkDatabase: DatabaseCheck): Router {
  const router = Router();
  router.get('/health', createHealthController(checkDatabase));
  return router;
}
