import { parseEnv } from './env-schema.js';

// Parsed once at import time so a misconfigured process fails on boot, not on first request.
// Kept apart from env-schema.ts so tests can exercise the parsing without this side effect.
export const env = parseEnv(process.env);
