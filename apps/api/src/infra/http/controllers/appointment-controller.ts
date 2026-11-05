import type { RequestHandler } from 'express';
import type { CancelAppointment } from '../../../application/use-cases/cancel-appointment.js';
import type { CreateAppointment } from '../../../application/use-cases/create-appointment.js';
import type { ListClientAppointments } from '../../../application/use-cases/list-client-appointments.js';
import type { ListProviderAppointments } from '../../../application/use-cases/list-provider-appointments.js';
import { requireAuth } from '../middlewares/ensure-authenticated.js';
import {
  clientAppointmentsQuerySchema,
  createAppointmentBodySchema,
  providerAppointmentsQuerySchema,
} from '../schemas/appointment-schemas.js';
import { idParamsSchema } from '../schemas/id-params-schema.js';

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

export function createCancelAppointmentController(
  cancelAppointment: CancelAppointment,
): RequestHandler {
  return async (request, response) => {
    const { userId } = requireAuth(request);
    const { id } = idParamsSchema.parse(request.params);
    const appointment = await cancelAppointment.execute({ appointmentId: id, requesterId: userId });
    response.status(200).json({ appointment });
  };
}

export function createListClientAppointmentsController(
  listClientAppointments: ListClientAppointments,
): RequestHandler {
  return async (request, response) => {
    const { userId } = requireAuth(request);
    const query = clientAppointmentsQuerySchema.parse(request.query);
    const page = await listClientAppointments.execute({ ...query, clientId: userId });
    response.status(200).json(page);
  };
}

export function createListProviderAppointmentsController(
  listProviderAppointments: ListProviderAppointments,
): RequestHandler {
  return async (request, response) => {
    const { userId } = requireAuth(request);
    const { from, to, ...filters } = providerAppointmentsQuerySchema.parse(request.query);
    const data = await listProviderAppointments.execute({
      ...filters,
      providerId: userId,
      interval: { start: from, end: to },
    });
    response.status(200).json({ data });
  };
}
