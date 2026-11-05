import { Router, type RequestHandler } from 'express';
import type { CancelAppointment } from '../../../application/use-cases/cancel-appointment.js';
import type { CreateAppointment } from '../../../application/use-cases/create-appointment.js';
import type { ListClientAppointments } from '../../../application/use-cases/list-client-appointments.js';
import type { ListProviderAppointments } from '../../../application/use-cases/list-provider-appointments.js';
import {
  createCancelAppointmentController,
  createCreateAppointmentController,
  createListClientAppointmentsController,
  createListProviderAppointmentsController,
} from '../controllers/appointment-controller.js';

interface AppointmentUseCases {
  createAppointment: CreateAppointment;
  cancelAppointment: CancelAppointment;
  listClientAppointments: ListClientAppointments;
  listProviderAppointments: ListProviderAppointments;
}

// Any authenticated user may book, providers included (with someone else, never
// themselves). Who may cancel is decided per appointment in the use case.
export function createAppointmentRouter(
  useCases: AppointmentUseCases,
  ensureAuthenticated: RequestHandler,
  providerOnly: RequestHandler[],
): Router {
  const router = Router();
  router.post(
    '/appointments',
    ensureAuthenticated,
    createCreateAppointmentController(useCases.createAppointment),
  );
  router.get(
    '/appointments',
    ensureAuthenticated,
    createListClientAppointmentsController(useCases.listClientAppointments),
  );
  router.patch(
    '/appointments/:id/cancel',
    ensureAuthenticated,
    createCancelAppointmentController(useCases.cancelAppointment),
  );
  router.get(
    '/provider/appointments',
    providerOnly,
    createListProviderAppointmentsController(useCases.listProviderAppointments),
  );
  return router;
}
