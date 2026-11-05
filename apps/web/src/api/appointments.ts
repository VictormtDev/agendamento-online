import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { APPOINTMENTS_KEY, SLOTS_KEY, type Appointment } from './booking';
import { apiRequest, type Page } from './http-client';
import type { ServiceSummary } from './providers';

export const APPOINTMENTS_PER_PAGE = 10;

export interface ClientAppointment extends Appointment {
  service: ServiceSummary;
  provider: { id: string; name: string; timezone: string };
}

export interface ProviderAppointment extends Appointment {
  service: ServiceSummary;
  client: { id: string; name: string };
}

export function useProviderAgenda(from: Date, to: Date) {
  const query = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
  return useQuery({
    queryKey: [APPOINTMENTS_KEY, 'agenda', query.toString()],
    queryFn: async () =>
      (
        await apiRequest<{ data: ProviderAppointment[] }>(
          `/provider/appointments?${query.toString()}`,
        )
      ).data,
    placeholderData: keepPreviousData,
  });
}

export function useMyAppointments(page: number) {
  return useQuery({
    queryKey: [APPOINTMENTS_KEY, 'mine', page],
    queryFn: () =>
      apiRequest<Page<ClientAppointment>>(
        `/appointments?page=${String(page)}&perPage=${String(APPOINTMENTS_PER_PAGE)}`,
      ),
    placeholderData: keepPreviousData,
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appointmentId: string) =>
      (
        await apiRequest<{ appointment: Appointment }>(
          `/appointments/${encodeURIComponent(appointmentId)}/cancel`,
          { method: 'PATCH' },
        )
      ).appointment,
    // A canceled appointment frees its time for other clients.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] }),
        queryClient.invalidateQueries({ queryKey: [SLOTS_KEY] }),
      ]),
  });
}
