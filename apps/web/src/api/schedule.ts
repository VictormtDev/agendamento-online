import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SLOTS_KEY } from './booking';
import { apiRequest } from './http-client';

export interface AvailabilityWindow {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface TimeOff {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
}

export interface CreateTimeOffRequest {
  startsAt: string;
  endsAt: string;
  reason?: string;
}

const AVAILABILITY_KEY = ['availability'] as const;
const TIME_OFF_KEY = ['time-off'] as const;

export function useAvailability() {
  return useQuery({
    queryKey: AVAILABILITY_KEY,
    queryFn: async () =>
      (await apiRequest<{ availability: AvailabilityWindow[] }>('/availability')).availability,
  });
}

// Grid and time offs decide the free slots, so changing them refreshes those too.
function useInvalidate(key: readonly string[]) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: key }),
      queryClient.invalidateQueries({ queryKey: [SLOTS_KEY] }),
    ]);
}

export function useReplaceAvailability() {
  const invalidate = useInvalidate(AVAILABILITY_KEY);
  return useMutation({
    mutationFn: (windows: AvailabilityWindow[]) =>
      apiRequest<{ availability: AvailabilityWindow[] }>('/availability', {
        method: 'PUT',
        body: { windows },
      }),
    onSuccess: invalidate,
  });
}

export function useTimeOffs() {
  return useQuery({
    queryKey: TIME_OFF_KEY,
    queryFn: async () => (await apiRequest<{ timeOffs: TimeOff[] }>('/time-off')).timeOffs,
  });
}

export function useCreateTimeOff() {
  const invalidate = useInvalidate(TIME_OFF_KEY);
  return useMutation({
    mutationFn: (input: CreateTimeOffRequest) =>
      apiRequest<{ timeOff: TimeOff }>('/time-off', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useDeleteTimeOff() {
  const invalidate = useInvalidate(TIME_OFF_KEY);
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<undefined>(`/time-off/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}
