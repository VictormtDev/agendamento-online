import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ClientAppointment } from '../api/appointments';
import type { User } from '../api/auth';
import { apiError, mockFetch } from '../test/mock-fetch';
import { renderApp } from '../test/render-app';

const TIMEZONE = 'America/Sao_Paulo';
const LIST_URL = 'GET /api/v1/appointments?page=1&perPage=10';

const user: User = {
  id: 'b6f0c1a2-0000-4000-8000-000000000001',
  name: 'Carla Dias',
  email: 'carla@example.com',
  role: 'CLIENT',
  timezone: TIMEZONE,
  createdAt: '2026-11-01T12:00:00.000Z',
};

function appointment(
  id: string,
  startsAt: string,
  status: ClientAppointment['status'] = 'SCHEDULED',
): ClientAppointment {
  return {
    id,
    providerId: 'provider-1',
    clientId: user.id,
    serviceId: 'service-1',
    startsAt,
    endsAt: startsAt,
    status,
    canceledAt: null,
    createdAt: '2026-11-01T12:00:00.000Z',
    service: { id: 'service-1', name: 'Massagem', durationMinutes: 60, priceCents: 15000 },
    provider: { id: 'provider-1', name: 'Ana Souza', timezone: TIMEZONE },
  };
}

function page(items: ClientAppointment[]) {
  return {
    status: 200,
    body: { data: items, meta: { page: 1, perPage: 10, total: items.length } },
  };
}

const me = { 'GET /api/v1/me': { status: 200, body: { user } } };
// Far from any real "now", so the tests do not depend on the day they run.
const FUTURE = '2099-01-15T12:00:00.000Z';
const PAST = '2020-01-15T12:00:00.000Z';

describe('my appointments', () => {
  beforeEach(() => {
    localStorage.setItem('agendamento.accessToken', 'token-123');
  });

  it('should list the appointments in the provider timezone with their status', async () => {
    mockFetch({
      ...me,
      [LIST_URL]: page([appointment('a-1', FUTURE), appointment('a-2', PAST, 'CANCELED')]),
    });
    renderApp('/appointments');

    const [upcoming, canceled] = await screen.findAllByRole('listitem');
    expect(upcoming).toHaveTextContent('Massagem');
    expect(upcoming).toHaveTextContent('com Ana Souza');
    expect(upcoming).toHaveTextContent('quinta-feira, 15 de janeiro de 2099 às 09:00');
    expect(upcoming).toHaveTextContent('Agendado');
    expect(canceled).toHaveTextContent('Cancelado');
    // Only the upcoming one can be canceled.
    expect(screen.getAllByRole('button', { name: 'Cancelar agendamento' })).toHaveLength(1);
  });

  it('should not offer to cancel an appointment that already started', async () => {
    mockFetch({ ...me, [LIST_URL]: page([appointment('a-1', PAST)]) });
    renderApp('/appointments');

    expect(await screen.findByText('Agendado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar agendamento' })).not.toBeInTheDocument();
  });

  it('should cancel after confirming and show the updated status', async () => {
    let current = appointment('a-1', FUTURE);
    const fetchMock = mockFetch({
      ...me,
      [LIST_URL]: () => page([current]),
      'PATCH /api/v1/appointments/a-1/cancel': () => {
        current = { ...current, status: 'CANCELED' };
        return { status: 200, body: { appointment: current } };
      },
    });
    renderApp('/appointments');

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar agendamento' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sim, cancelar' }));

    expect(await screen.findByText('Cancelado')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/appointments/a-1/cancel',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('should keep the appointment when the user changes their mind', async () => {
    const fetchMock = mockFetch({ ...me, [LIST_URL]: page([appointment('a-1', FUTURE)]) });
    renderApp('/appointments');

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar agendamento' }));
    await userEvent.click(screen.getByRole('button', { name: 'Manter' }));

    expect(screen.getByRole('button', { name: 'Cancelar agendamento' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false);
  });

  it('should show the API refusal inside the 24-hour deadline', async () => {
    mockFetch({
      ...me,
      [LIST_URL]: page([appointment('a-1', FUTURE)]),
      'PATCH /api/v1/appointments/a-1/cancel': apiError(
        409,
        'CANCELLATION_DEADLINE_PASSED',
        'O cliente só pode cancelar até 24 horas antes do início',
      ),
    });
    renderApp('/appointments');

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar agendamento' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sim, cancelar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O cliente só pode cancelar até 24 horas antes do início',
    );
  });

  it('should point to the providers when there is nothing booked', async () => {
    mockFetch({ ...me, [LIST_URL]: page([]) });
    renderApp('/appointments');

    expect(
      await screen.findByRole('link', { name: 'Encontre um profissional' }),
    ).toBeInTheDocument();
  });
});
