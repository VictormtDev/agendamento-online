import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { createQueryClient } from './api/query-client';
import { AuthProvider } from './features/auth/auth-context';
import { RedirectIfAuthenticated, RequireAuth } from './features/auth/route-guards';
import { HomePage } from './pages/home-page';
import { LoginPage } from './pages/login-page';
import { RegisterPage } from './pages/register-page';

export function AppProviders({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RedirectIfAuthenticated />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  );
}

const queryClient = createQueryClient();

export function App() {
  return (
    <AppProviders queryClient={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
}
