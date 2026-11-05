import { z } from 'zod';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, ROLES } from '../../../domain/entities/user.js';
import { DEFAULT_TIMEZONE } from '../../../domain/timezone.js';
import { timezoneSchema } from './timezone-schema.js';

export const registerBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(254),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
  role: z.enum(ROLES).default('CLIENT'),
  timezone: timezoneSchema.default(DEFAULT_TIMEZONE),
});

export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
