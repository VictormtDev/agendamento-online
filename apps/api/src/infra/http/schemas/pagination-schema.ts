import { z } from 'zod';

const DEFAULT_PER_PAGE = 20;
// Above this, one request could pull a whole table.
const MAX_PER_PAGE = 100;

// Query strings are always text, hence coerce.
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(MAX_PER_PAGE).default(DEFAULT_PER_PAGE),
});
