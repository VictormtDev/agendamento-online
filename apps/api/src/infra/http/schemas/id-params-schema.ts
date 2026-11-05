import { z } from 'zod';

// Rejecting a malformed id here avoids sending it to a UUID column, where Postgres would fail with a 500.
export const idParamsSchema = z.object({ id: z.uuid() });
