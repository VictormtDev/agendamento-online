import { z } from 'zod';

// No clientId and no endsAt: the client comes from the token, and the end is derived
// from the service duration, so neither can be forged.
export const createAppointmentBodySchema = z.object({
  providerId: z.uuid(),
  serviceId: z.uuid(),
  startsAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
});
