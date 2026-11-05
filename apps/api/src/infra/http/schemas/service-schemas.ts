import { z } from 'zod';
import {
  isValidServiceDuration,
  MAX_SERVICE_DURATION_MINUTES,
  MAX_SERVICE_PRICE_CENTS,
  MIN_SERVICE_DURATION_MINUTES,
  SERVICE_DURATION_STEP_MINUTES,
} from '../../../domain/entities/service.js';

const DURATION_MESSAGE = `A duração deve ser múltipla de ${String(SERVICE_DURATION_STEP_MINUTES)} minutos, entre ${String(MIN_SERVICE_DURATION_MINUTES)} e ${String(MAX_SERVICE_DURATION_MINUTES)}`;

const name = z.string().trim().min(1).max(100);
// The rule itself lives in the domain; the schema only reuses it to answer with a 400.
const durationMinutes = z.number().refine(isValidServiceDuration, DURATION_MESSAGE);
// Zero is allowed on purpose: free services (e.g. a first evaluation) are common.
const priceCents = z.number().int().min(0).max(MAX_SERVICE_PRICE_CENTS);

export const createServiceBodySchema = z.object({ name, durationMinutes, priceCents });

// exactOptional (unlike partial) types absent fields as missing, not as `undefined`,
// which matches the strict optional properties of the repository port.
export const updateServiceBodySchema = z
  .object({
    name: name.exactOptional(),
    durationMinutes: durationMinutes.exactOptional(),
    priceCents: priceCents.exactOptional(),
    active: z.boolean().exactOptional(),
  })
  .refine((changes) => Object.keys(changes).length > 0, 'Informe ao menos um campo para atualizar');

export const serviceParamsSchema = z.object({ id: z.uuid() });
