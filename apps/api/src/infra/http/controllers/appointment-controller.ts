import type { RequestHandler } from 'express';
import type { CreateAppointment } from '../../../application/use-cases/create-appointment.js';
import { requireAuth } from '../middlewares/ensure-authenticated.js';
import { createAppointmentBodySchema } from '../schemas/appointment-schemas.js';

export function createCreateAppointmentController(
  createAppointment: CreateAppointment,
): RequestHandler {
  return async (request, response) => {
    const { userId } = requireAuth(request);
    const body = createAppointmentBodySchema.parse(request.body);
    const appointment = await createAppointment.execute({ ...body, clientId: userId });
    response.status(201).json({ appointment });
  };
}
