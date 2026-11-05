import { z } from 'zod';
import { timezoneSchema } from './timezone-schema.js';

// Only the timezone is editable for now; other profile fields can join this schema later.
export const updateProfileBodySchema = z.object({ timezone: timezoneSchema });
