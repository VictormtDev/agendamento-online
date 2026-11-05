import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { User } from '../api/auth';
import { apiError, mockFetch } from '../test/mock-fetch';
import { renderApp } from '../test/render-app';

const PROVIDER_ID = 'b6f0c1a2-0000-4000-8000-0000000000aa';

const user: User = {
  id: 'b6f0c1a2-0000-4000-8000-000000000001',
  name: 'Carla Dias',
  email: 'carla@example.com',
  role: 'CLIENT',
  timezone: 'America/Sao_Paulo',
  createdAt: '2026-11-01T12:00:00.000Z',
};

const me = { 'GET /api/v1/me': { status: 200, body: { user } } };

function providersPage(page: number, total: number, names: string[]) {
  return {
    status: 200,
    body: {
      data: names.map((name, index) => ({
        id: index === 0 ? PROVIDER_ID : `id-${name}`,
        name,
        activeServiceCount: index + 1,
      })),
      meta: { page, perPage: 12, total },
    },
  };
}

describe('providers', () => {
  beforeEach(() => {
    localStorage.setItem('agendamento.accessToken', 'token-123');
  });

  it('should list the providers with their service count', async () => {
    mockFetch({
      ...me,
      'GET /api/v1/providers?page=1&perPage=12': providersPage(1, 2, ['Ana Souza', 'Bruno Lima']),
    });
    renderApp('/');

    expect(await screen.findByRole('link', { name: /Ana Souza/ })).toHaveTextContent('1 serviço');
    expect(screen.getByRole('link', { name: /Bruno Lima/ })).toHaveTextContent('2 serviços');
    expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument();
  });

  it('should move to the next page', async () => {
    mockFetch({
      ...me,
      'GET /api/v1/providers?page=1&perPage=12': providersPage(1, 13, ['Ana Souza']),
      'GET /api/v1/providers?page=2&perPage=12': providersPage(2, 13, ['Zeca Prado']),
    });
    renderApp('/providers');

    await userEvent.click(await screen.findByRole('button', { name: 'Próxima' }));

    expect(await screen.findByRole('link', { name: /Zeca Prado/ })).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
  });

  it('should show an empty state when no provider is bookable', async () => {
    mockFetch({ ...me, 'GET /api/v1/providers?page=1&perPage=12': providersPage(1, 0, []) });
    renderApp('/providers');

    expect(
      await screen.findByText('Nenhum profissional disponível no momento.'),
    ).toBeInTheDocument();
  });

  it('should open the provider page with services, duration and price', async () => {
    mockFetch({
      ...me,
      'GET /api/v1/providers?page=1&perPage=12': providersPage(1, 1, ['Ana Souza']),
      [`GET /api/v1/providers/${PROVIDER_ID}`]: {
        status: 200,
        body: {
          provider: { id: PROVIDER_ID, name: 'Ana Souza', timezone: 'America/Sao_Paulo' },
          services: [{ id: 'service-1', name: 'Massagem', durationMinutes: 90, priceCents: 15000 }],
        },
      },
    });
    renderApp('/providers');

    await userEvent.click(await screen.findByRole('link', { name: /Ana Souza/ }));

    expect(await screen.findByRole('heading', { name: 'Ana Souza' })).toBeInTheDocument();
    const service = screen.getByRole('listitem');
    expect(within(service).getByText('Massagem')).toBeInTheDocument();
    expect(within(service).getByText('1 h 30 min')).toBeInTheDocument();
    expect(within(service).getByText(/R\$\s150,00/u)).toBeInTheDocument();
  });

  it('should show the API message for an unknown provider', async () => {
    mockFetch({
      ...me,
      [`GET /api/v1/providers/${PROVIDER_ID}`]: apiError(
        404,
        'PROVIDER_NOT_FOUND',
        'Profissional não encontrado',
      ),
    });
    renderApp(`/providers/${PROVIDER_ID}`);

    expect(await screen.findByRole('alert')).toHaveTextContent('Profissional não encontrado');
  });
});
