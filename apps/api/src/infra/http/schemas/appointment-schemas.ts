import { addDays } from 'date-fns';
import { z } from 'zod';
import { APPOINTMENT_STATUSES } from '../../../domain/entities/appointment.js';
import { instantSchema } from './instant-schema.js';
import { paginationQuerySchema } from './pagination-schema.js';

// An API limit, not a business rule: enough for the day and week views of the
// dashboard while keeping the unpaginated provider listing small.
const MAX_AGENDA_RANGE_DAYS = 31;

// No clientId and no endsAt: the client comes from the token, and the end is derived
// from the service duration, so neither can be forged.
export const createAppointmentBodySchema = z.object({
  providerId: z.uuid(),
  serviceId: z.uuid(),
  startsAt: instantSchema,
});

const status = z.enum(APPOINTMENT_STATUSES).exactOptional();

export const clientAppointmentsQuerySchema = paginationQuerySchema.extend({ status });

export const providerAppointmentsQuerySchema = z
  .object({ from: instantSchema, to: instantSchema, status })
  .refine((query) => query.from < query.to, {
    message: 'O fim do período deve ser depois do início',
    path: ['to'],
  })
  .refine((query) => query.to <= addDays(query.from, MAX_AGENDA_RANGE_DAYS), {
    message: `O período pode ter no máximo ${String(MAX_AGENDA_RANGE_DAYS)} dias`,
    path: ['to'],
  });
