import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { User } from '../api/auth';
import type { ServiceSummary } from '../api/providers';
import { apiError, mockFetch } from '../test/mock-fetch';
import { renderApp } from '../test/render-app';

const provider: User = {
  id: 'b6f0c1a2-0000-4000-8000-0000000000aa',
  name: 'Ana Souza',
  email: 'ana@example.com',
  role: 'PROVIDER',
  timezone: 'America/Sao_Paulo',
  createdAt: '2026-11-01T12:00:00.000Z',
};

const massagem: ServiceSummary = {
  id: 'service-1',
  name: 'Massagem',
  durationMinutes: 60,
  priceCents: 15000,
};

const PROFILE_URL = `GET /api/v1/providers/${provider.id}`;

function profileWith(services: ServiceSummary[]) {
  return {
    status: 200,
    body: {
      provider: { id: provider.id, name: provider.name, timezone: provider.timezone },
      services,
    },
  };
}

function sentBody(fetchMock: ReturnType<typeof mockFetch>, method: string): unknown {
  const call = fetchMock.mock.calls.find(([, init]) => init?.method === method);
  // The client always sends JSON strings, never other body types.
  return JSON.parse(call?.[1]?.body as string);
}

describe('provider services', () => {
  let services: ServiceSummary[];

  beforeEach(() => {
    localStorage.setItem('agendamento.accessToken', 'token-123');
    services = [massagem];
  });

  const baseRoutes = () => ({
    'GET /api/v1/me': { status: 200, body: { user: provider } },
    // Read on each call, so the list reflects the changes made during the test.
    [PROFILE_URL]: () => profileWith(services),
  });

  it('should list the active services with duration and price', async () => {
    mockFetch(baseRoutes());
    renderApp('/dashboard/services');

    const row = await screen.findByRole('listitem', { name: 'Massagem' });
    expect(row).toHaveTextContent(/1 h · R\$\s150,00/u);
  });

  it('should create a service, sending the price in cents', async () => {
    const fetchMock = mockFetch({
      ...baseRoutes(),
      'POST /api/v1/services': () => {
        const created = { id: 'service-2', name: 'Corte', durationMinutes: 45, priceCents: 4550 };
        services = [...services, created];
        return { status: 201, body: { service: created } };
      },
    });
    renderApp('/dashboard/services');

    await userEvent.type(await screen.findByLabelText('Nome'), 'Corte');
    await userEvent.selectOptions(screen.getByLabelText('Duração'), '45 min');
    await userEvent.type(screen.getByLabelText('Preço (R$)'), '45.5');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar serviço' }));

    expect(await screen.findByRole('listitem', { name: 'Corte' })).toBeInTheDocument();
    expect(sentBody(fetchMock, 'POST')).toEqual({
      name: 'Corte',
      durationMinutes: 45,
      priceCents: 4550,
    });
    expect(screen.getByLabelText('Nome')).toHaveValue('');
  });

  it('should validate the form before calling the API', async () => {
    const fetchMock = mockFetch(baseRoutes());
    renderApp('/dashboard/services');

    await userEvent.click(await screen.findByRole('button', { name: 'Adicionar serviço' }));

    expect(await screen.findByText('Informe o nome do serviço')).toBeInTheDocument();
    expect(screen.getByText('Informe o preço')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('should edit a service in place', async () => {
    const fetchMock = mockFetch({
      ...baseRoutes(),
      'PATCH /api/v1/services/service-1': () => {
        services = [{ ...massagem, name: 'Massagem relaxante' }];
        return { status: 200, body: { service: services[0] } };
      },
    });
    renderApp('/dashboard/services');

    const row = await screen.findByRole('listitem', { name: 'Massagem' });
    await userEvent.click(within(row).getByRole('button', { name: 'Editar' }));
    const name = screen.getByDisplayValue('Massagem');
    await userEvent.clear(name);
    await userEvent.type(name, 'Massagem relaxante');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('listitem', { name: 'Massagem relaxante' })).toBeInTheDocument();
    expect(sentBody(fetchMock, 'PATCH')).toEqual({
      name: 'Massagem relaxante',
      durationMinutes: 60,
      priceCents: 15000,
    });
  });

  it('should remove a service after confirming', async () => {
    mockFetch({
      ...baseRoutes(),
      'DELETE /api/v1/services/service-1': () => {
        services = [];
        return { status: 204, body: null };
      },
    });
    renderApp('/dashboard/services');

    const row = await screen.findByRole('listitem', { name: 'Massagem' });
    await userEvent.click(within(row).getByRole('button', { name: 'Remover' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sim, remover' }));

    expect(await screen.findByText(/Nenhum serviço ainda/u)).toBeInTheDocument();
  });

  it('should show the API message when saving fails', async () => {
    mockFetch({
      ...baseRoutes(),
      'POST /api/v1/services': apiError(400, 'VALIDATION_ERROR', 'Dados inválidos'),
    });
    renderApp('/dashboard/services');

    await userEvent.type(await screen.findByLabelText('Nome'), 'Corte');
    await userEvent.type(screen.getByLabelText('Preço (R$)'), '10');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar serviço' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Dados inválidos');
  });
});
