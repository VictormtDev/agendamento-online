import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './http-client';

export interface Slot {
  startsAt: string;
  endsAt: string;
}

export interface SlotsResponse {
  timezone: string;
  slots: Slot[];
}

export interface Appointment {
  id: string;
  providerId: string;
  clientId: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  status: 'SCHEDULED' | 'CANCELED' | 'COMPLETED' | 'NO_SHOW';
  canceledAt: string | null;
  createdAt: string;
}

export interface CreateAppointmentRequest {
  providerId: string;
  serviceId: string;
  startsAt: string;
}

const SLOTS_KEY = 'slots';

export function useSlots(providerId: string, serviceId: string, date: string) {
  return useQuery({
    queryKey: [SLOTS_KEY, providerId, serviceId, date],
    queryFn: () => {
      const query = new URLSearchParams({ serviceId, date });
      return apiRequest<SlotsResponse>(
        `/providers/${encodeURIComponent(providerId)}/slots?${query.toString()}`,
      );
    },
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAppointmentRequest) =>
      (
        await apiRequest<{ appointment: Appointment }>('/appointments', {
          method: 'POST',
          body: input,
        })
      ).appointment,
    // Booked or refused as taken, the free slots changed either way.
    onSettled: () => queryClient.invalidateQueries({ queryKey: [SLOTS_KEY] }),
  });
}
