import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { User } from '../api/auth';
import { todayIn } from '../lib/format';
import { apiError, mockFetch } from '../test/mock-fetch';
import { renderApp } from '../test/render-app';

const TIMEZONE = 'America/Sao_Paulo';
const PROVIDER_ID = 'b6f0c1a2-0000-4000-8000-0000000000aa';
const SERVICE_ID = 'b6f0c1a2-0000-4000-8000-0000000000bb';
const TODAY = todayIn(TIMEZONE);
const OTHER_DAY = '2099-01-15';

const user: User = {
  id: 'b6f0c1a2-0000-4000-8000-000000000001',
  name: 'Carla Dias',
  email: 'carla@example.com',
  role: 'CLIENT',
  timezone: TIMEZONE,
  createdAt: '2026-11-01T12:00:00.000Z',
};

const profile = {
  status: 200,
  body: {
    provider: { id: PROVIDER_ID, name: 'Ana Souza', timezone: TIMEZONE },
    services: [{ id: SERVICE_ID, name: 'Massagem', durationMinutes: 60, priceCents: 15000 }],
  },
};

// São Paulo is UTC-3 all year, so 12:00Z is 09:00 there.
function slotsAt(date: string, utcHours: string[]) {
  return {
    status: 200,
    body: {
      timezone: TIMEZONE,
      slots: utcHours.map((hour) => ({
        startsAt: `${date}T${hour}:00:00.000Z`,
        endsAt: `${date}T${hour}:59:00.000Z`,
      })),
    },
  };
}

const slotsUrl = (date: string) =>
  `GET /api/v1/providers/${PROVIDER_ID}/slots?serviceId=${SERVICE_ID}&date=${date}`;

const baseRoutes = {
  'GET /api/v1/me': { status: 200, body: { user } },
  [`GET /api/v1/providers/${PROVIDER_ID}`]: profile,
};

function sentBody(fetchMock: ReturnType<typeof mockFetch>, url: string): unknown {
  const call = fetchMock.mock.calls.find(([calledUrl]) => calledUrl === url);
  // The client always sends JSON strings, never other body types.
  return JSON.parse(call?.[1]?.body as string);
}

describe('booking flow', () => {
  beforeEach(() => {
    localStorage.setItem('agendamento.accessToken', 'token-123');
  });

  it('should go from service to date, time and confirmation', async () => {
    const fetchMock = mockFetch({
      ...baseRoutes,
      [slotsUrl(TODAY)]: slotsAt(TODAY, []),
      [slotsUrl(OTHER_DAY)]: slotsAt(OTHER_DAY, ['12', '13']),
      'POST /api/v1/appointments': {
        status: 201,
        body: { appointment: { id: 'a-1', startsAt: `${OTHER_DAY}T13:00:00.000Z` } },
      },
    });
    renderApp(`/providers/${PROVIDER_ID}`);

    await userEvent.click(await screen.findByRole('link', { name: 'Agendar Massagem' }));
    expect(await screen.findByText('Nenhum horário disponível nesta data.')).toBeInTheDocument();

    // Native date pickers cannot be typed into in jsdom; change is what the browser fires.
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: OTHER_DAY } });
    await userEvent.click(await screen.findByRole('button', { name: '10:00' }));

    expect(screen.getByRole('heading', { name: 'Confirme o agendamento' })).toBeInTheDocument();
    expect(screen.getByText('quinta-feira, 15 de janeiro de 2099 às 10:00')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }));

    expect(
      await screen.findByRole('heading', { name: 'Agendamento confirmado!' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver meus agendamentos' })).toHaveAttribute(
      'href',
      '/appointments',
    );
    expect(sentBody(fetchMock, '/api/v1/appointments')).toEqual({
      providerId: PROVIDER_ID,
      serviceId: SERVICE_ID,
      startsAt: `${OTHER_DAY}T13:00:00.000Z`,
    });
  });

  it('should send the user back to the refreshed times when the slot was just taken', async () => {
    const fetchMock = mockFetch({
      ...baseRoutes,
      [slotsUrl(TODAY)]: slotsAt(TODAY, ['12']),
      'POST /api/v1/appointments': apiError(409, 'SLOT_UNAVAILABLE', 'Horário indisponível'),
    });
    renderApp(`/providers/${PROVIDER_ID}/services/${SERVICE_ID}/book`);

    await userEvent.click(await screen.findByRole('button', { name: '09:00' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esse horário acabou de ser reservado. Escolha outro.',
    );
    expect(screen.getByLabelText('Data')).toBeInTheDocument();
    const slotRequests = fetchMock.mock.calls.filter(([url]) => url.includes('/slots'));
    expect(slotRequests.length).toBeGreaterThan(1);
  });

  it('should keep the confirmation open and show other refusals', async () => {
    mockFetch({
      ...baseRoutes,
      [slotsUrl(TODAY)]: slotsAt(TODAY, ['12']),
      'POST /api/v1/appointments': apiError(
        409,
        'SELF_BOOKING_NOT_ALLOWED',
        'Não é possível agendar um horário consigo mesmo',
      ),
    });
    renderApp(`/providers/${PROVIDER_ID}/services/${SERVICE_ID}/book`);

    await userEvent.click(await screen.findByRole('button', { name: '09:00' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não é possível agendar um horário consigo mesmo',
    );
    expect(screen.getByRole('heading', { name: 'Confirme o agendamento' })).toBeInTheDocument();
  });

  it('should let the user pick another time from the confirmation', async () => {
    mockFetch({ ...baseRoutes, [slotsUrl(TODAY)]: slotsAt(TODAY, ['12']) });
    renderApp(`/providers/${PROVIDER_ID}/services/${SERVICE_ID}/book`);

    await userEvent.click(await screen.findByRole('button', { name: '09:00' }));
    await userEvent.click(screen.getByRole('button', { name: 'Escolher outro horário' }));

    expect(screen.getByRole('button', { name: '09:00' })).toBeInTheDocument();
  });

  it('should not offer days before today in the provider timezone', async () => {
    mockFetch({ ...baseRoutes, [slotsUrl(TODAY)]: slotsAt(TODAY, []) });
    renderApp(`/providers/${PROVIDER_ID}/services/${SERVICE_ID}/book`);

    expect(await screen.findByLabelText('Data')).toHaveAttribute('min', TODAY);
  });

  it('should tell when the service no longer exists', async () => {
    mockFetch(baseRoutes);
    renderApp(`/providers/${PROVIDER_ID}/services/unknown/book`);

    expect(await screen.findByRole('alert')).toHaveTextContent('Serviço não encontrado.');
  });
});
