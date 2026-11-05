import { z } from 'zod';
import { isValidTimezone } from '../../../domain/timezone.js';

export const timezoneSchema = z
  .string()
  .refine(isValidTimezone, 'Fuso horário inválido; use um nome IANA, como America/Sao_Paulo');
