import { z } from 'zod';
import { MAX_TIME_OFF_REASON_LENGTH } from '../../../domain/entities/time-off.js';

// An explicit offset is required: a bare "2026-12-01T09:00" would be read in the
// server timezone, which is exactly the ambiguity UTC storage is meant to avoid.
const instant = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

// Whether the period is valid depends on "now", so that check lives in the use case.
export const createTimeOffBodySchema = z.object({
  startsAt: instant,
  endsAt: instant,
  reason: z
    .string()
    .trim()
    .min(1)
    .max(MAX_TIME_OFF_REASON_LENGTH)
    .nullish()
    .transform((reason) => reason ?? null),
});
