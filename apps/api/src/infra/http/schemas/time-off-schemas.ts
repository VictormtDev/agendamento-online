import { z } from 'zod';
import { MAX_TIME_OFF_REASON_LENGTH } from '../../../domain/entities/time-off.js';
import { instantSchema } from './instant-schema.js';

// Whether the period is valid depends on "now", so that check lives in the use case.
export const createTimeOffBodySchema = z.object({
  startsAt: instantSchema,
  endsAt: instantSchema,
  reason: z
    .string()
    .trim()
    .min(1)
    .max(MAX_TIME_OFF_REASON_LENGTH)
    .nullish()
    .transform((reason) => reason ?? null),
});
