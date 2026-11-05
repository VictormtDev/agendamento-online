import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from './http-client';

export type Role = 'CLIENT' | 'PROVIDER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  timezone: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
  role: Role;
}

export const meQueryKey = ['me'] as const;

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginRequest) =>
      apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: input }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterRequest) =>
      apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: input }),
  });
}

// The profile only changes through this app, which updates the cache itself,
// so it never goes stale on its own.
export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async () => (await apiRequest<{ user: User }>('/me')).user,
    enabled,
    staleTime: Infinity,
  });
}
