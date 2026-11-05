import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './http-client';

const MAX_RETRIES = 2;

// A 4xx will not change on retry (bad input, no permission), so only network and
// server failures are retried.
function shouldRetry(failureCount: number, error: Error): boolean {
  const isClientError = error instanceof ApiError && error.status >= 400 && error.status < 500;
  return !isClientError && failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry },
    },
  });
}
