import { z } from 'zod';

// z.iso.date() also rejects impossible days such as 2026-02-30.
export const slotsQuerySchema = z.object({
  serviceId: z.uuid(),
  date: z.iso.date(),
});
