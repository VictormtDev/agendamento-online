import { Router, type RequestHandler } from 'express';
import type { CreateAppointment } from '../../../application/use-cases/create-appointment.js';
import { createCreateAppointmentController } from '../controllers/appointment-controller.js';

// Any authenticated user may book, providers included (with someone else, never themselves).
export function createAppointmentRouter(
  createAppointment: CreateAppointment,
  ensureAuthenticated: RequestHandler,
): Router {
  const router = Router();
  router.post(
    '/appointments',
    ensureAuthenticated,
    createCreateAppointmentController(createAppointment),
  );
  return router;
}
