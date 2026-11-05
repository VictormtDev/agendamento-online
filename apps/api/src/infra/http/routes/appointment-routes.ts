import { Router, type RequestHandler } from 'express';
import type { CancelAppointment } from '../../../application/use-cases/cancel-appointment.js';
import type { CreateAppointment } from '../../../application/use-cases/create-appointment.js';
import {
  createCancelAppointmentController,
  createCreateAppointmentController,
} from '../controllers/appointment-controller.js';

interface AppointmentUseCases {
  createAppointment: CreateAppointment;
  cancelAppointment: CancelAppointment;
}

// Any authenticated user may book, providers included (with someone else, never
// themselves). Who may cancel is decided per appointment in the use case.
export function createAppointmentRouter(
  useCases: AppointmentUseCases,
  ensureAuthenticated: RequestHandler,
): Router {
  const router = Router();
  router.post(
    '/appointments',
    ensureAuthenticated,
    createCreateAppointmentController(useCases.createAppointment),
  );
  router.patch(
    '/appointments/:id/cancel',
    ensureAuthenticated,
    createCancelAppointmentController(useCases.cancelAppointment),
  );
  return router;
}
