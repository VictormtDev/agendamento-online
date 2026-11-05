import { z } from 'zod';
import {
  hasOverlappingWindows,
  isChronologicalWindow,
  isValidTimeOfDay,
  MAX_WEEKDAY,
  MIN_WEEKDAY,
} from '../../../domain/entities/availability.js';
import { SLOT_INTERVAL_MINUTES } from '../../../domain/scheduling-rules.js';

// Not a business rule, just a ceiling against abusive payloads: a real week needs far fewer.
const MAX_WINDOWS_PER_REQUEST = 100;

const timeOfDay = z
  .string()
  .refine(
    isValidTimeOfDay,
    `Use o formato HH:mm em múltiplos de ${String(SLOT_INTERVAL_MINUTES)} minutos`,
  );

const availabilityWindowSchema = z
  .object({
    weekday: z.number().int().min(MIN_WEEKDAY).max(MAX_WEEKDAY),
    startTime: timeOfDay,
    endTime: timeOfDay,
  })
  .refine(isChronologicalWindow, {
    message: 'O fim deve ser depois do início',
    path: ['endTime'],
  });

// An empty list is valid: it clears the grid, e.g. when the provider stops taking bookings.
export const replaceAvailabilityBodySchema = z.object({
  windows: z
    .array(availabilityWindowSchema)
    .max(MAX_WINDOWS_PER_REQUEST)
    .refine((windows) => !hasOverlappingWindows(windows), 'Há janelas sobrepostas no mesmo dia'),
});
