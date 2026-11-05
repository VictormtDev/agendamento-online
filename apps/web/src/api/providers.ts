import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiRequest, type Page } from './http-client';

export const PROVIDERS_PER_PAGE = 12;

export interface ProviderSummary {
  id: string;
  name: string;
  activeServiceCount: number;
}

export interface ServiceSummary {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
}

export interface ProviderProfile {
  provider: { id: string; name: string; timezone: string };
  services: ServiceSummary[];
}

export function useProviders(page: number) {
  return useQuery({
    queryKey: ['providers', page],
    queryFn: () =>
      apiRequest<Page<ProviderSummary>>(
        `/providers?page=${String(page)}&perPage=${String(PROVIDERS_PER_PAGE)}`,
      ),
    // Keeps the current page on screen while the next one loads, instead of flashing empty.
    placeholderData: keepPreviousData,
  });
}

export function useProviderProfile(providerId: string) {
  return useQuery({
    queryKey: ['providers', 'profile', providerId],
    queryFn: () => apiRequest<ProviderProfile>(`/providers/${encodeURIComponent(providerId)}`),
  });
}
