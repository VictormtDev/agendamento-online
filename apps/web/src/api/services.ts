import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './http-client';
import type { ServiceSummary } from './providers';

export interface ServiceInput {
  name: string;
  durationMinutes: number;
  priceCents: number;
}

// The provider's services are read from the public profile, which lists the active ones,
// so every change refreshes the provider queries.
function useInvalidateProviders() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['providers'] });
}

export function useCreateService() {
  const invalidate = useInvalidateProviders();
  return useMutation({
    mutationFn: (input: ServiceInput) =>
      apiRequest<{ service: ServiceSummary }>('/services', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateService() {
  const invalidate = useInvalidateProviders();
  return useMutation({
    mutationFn: ({ id, ...changes }: ServiceInput & { id: string }) =>
      apiRequest<{ service: ServiceSummary }>(`/services/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: changes,
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteService() {
  const invalidate = useInvalidateProviders();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<undefined>(`/services/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}
