import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { createQueryClient } from '../api/query-client';
import { AppProviders, AppRoutes } from '../app';

/** Renders the whole app at a given path, with a fresh cache so tests stay independent. */
export function renderApp(path = '/') {
  return render(
    <AppProviders queryClient={createQueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );
}
