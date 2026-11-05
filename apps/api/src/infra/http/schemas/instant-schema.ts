import { z } from 'zod';

// An explicit offset is required: a bare "2026-12-01T09:00" would be read in the
// server timezone, which is exactly the ambiguity UTC storage is meant to avoid.
export const instantSchema = z.iso.datetime({ offset: true }).transform((value) => new Date(value));
