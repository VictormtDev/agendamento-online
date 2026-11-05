import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ProviderAppointment } from '../api/appointments';
import type { User } from '../api/auth';
import { agendaRange } from '../lib/agenda-range';
import { todayIn } from '../lib/format';
import { mockFetch } from '../test/mock-fetch';
import { renderApp } from '../test/render-app';

const TIMEZONE = 'America/Sao_Paulo';
// A Thursday far from the real "now", so the tests do not depend on the day they run.
const DATE = '2099-01-15';

const provider: User = {
  id: 'b6f0c1a2-0000-4000-8000-0000000000aa',
  name: 'Ana Souza',
  email: 'ana@example.com',
  role: 'PROVIDER',
  timezone: TIMEZONE,
  createdAt: '2026-11-01T12:00:00.000Z',
};

function agendaUrl(from: string, to: string) {
  return `GET /api/v1/provider/appointments?${new URLSearchParams({ from, to }).toString()}`;
}

function appointment(id: string, startsAt: string, endsAt: string): ProviderAppointment {
  return {
    id,
    providerId: provider.id,
    clientId: 'client-1',
    serviceId: 'service-1',
    startsAt,
    endsAt,
    status: 'SCHEDULED',
    canceledAt: null,
    createdAt: '2026-11-01T12:00:00.000Z',
    service: { id: 'service-1', name: 'Massagem', durationMinutes: 60, priceCents: 15000 },
    client: { id: 'client-1', name: 'Carla Dias' },
  };
}

const agendaOf = (items: ProviderAppointment[]) => ({ status: 200, body: { data: items } });
const meAs = (user: User) => ({ 'GET /api/v1/me': { status: 200, body: { user } } });

// São Paulo is UTC-3, so local midnight of the 15th is 03:00Z.
const DAY_URL = agendaUrl('2099-01-15T03:00:00.000Z', '2099-01-16T03:00:00.000Z');
const NEXT_DAY_URL = agendaUrl('2099-01-16T03:00:00.000Z', '2099-01-17T03:00:00.000Z');
const WEEK_URL = agendaUrl('2099-01-12T03:00:00.000Z', '2099-01-19T03:00:00.000Z');

describe('provider agenda', () => {
  beforeEach(() => {
    localStorage.setItem('agendamento.accessToken', 'token-123');
  });

  it("should land a provider on today's agenda", async () => {
    const today = agendaRange('day', todayIn(TIMEZONE), TIMEZONE);
    mockFetch({
      ...meAs(provider),
      [agendaUrl(today.from.toISOString(), today.to.toISOString())]: agendaOf([]),
    });
    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Agenda' })).toBeInTheDocument();
    // Only answered if the agenda asked for today, in the provider timezone.
    expect(await screen.findByText('Nenhum agendamento.')).toBeInTheDocument();
  });

  it('should keep clients out of the provider area', async () => {
    mockFetch({
      ...meAs({ ...provider, role: 'CLIENT' }),
      'GET /api/v1/providers?page=1&perPage=12': {
        status: 200,
        body: { data: [], meta: { page: 1, perPage: 12, total: 0 } },
      },
    });
    renderApp('/dashboard');

    expect(await screen.findByRole('heading', { name: 'Profissionais' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Agenda' })).not.toBeInTheDocument();
  });

  it('should show the appointments of the day with time, service and client', async () => {
    mockFetch({
      ...meAs(provider),
      [DAY_URL]: agendaOf([
        appointment('a-1', '2099-01-15T12:00:00.000Z', '2099-01-15T13:00:00.000Z'),
      ]),
    });
    renderApp(`/dashboard?date=${DATE}`);

    const day = await screen.findByRole('region', { name: 'quinta-feira, 15 de janeiro' });
    expect(await within(day).findByText('09:00–10:00 · Massagem')).toBeInTheDocument();
    expect(within(day).getByText('Carla Dias')).toBeInTheDocument();
    expect(within(day).getByRole('button', { name: 'Cancelar agendamento' })).toBeInTheDocument();
  });

  it('should move to the next day', async () => {
    mockFetch({ ...meAs(provider), [DAY_URL]: agendaOf([]), [NEXT_DAY_URL]: agendaOf([]) });
    renderApp(`/dashboard?date=${DATE}`);

    await userEvent.click(await screen.findByRole('button', { name: 'Próximo dia' }));

    expect(
      await screen.findByRole('region', { name: 'sexta-feira, 16 de janeiro' }),
    ).toBeInTheDocument();
  });

  it('should group the week by day, Monday to Sunday', async () => {
    mockFetch({
      ...meAs(provider),
      [DAY_URL]: agendaOf([]),
      [WEEK_URL]: agendaOf([
        // 23:30 local on Tuesday is already Wednesday in UTC.
        appointment('a-1', '2099-01-14T02:30:00.000Z', '2099-01-14T03:30:00.000Z'),
      ]),
    });
    renderApp(`/dashboard?date=${DATE}`);

    await userEvent.click(await screen.findByRole('button', { name: 'Semana' }));

    const days = await screen.findAllByRole('region');
    expect(days).toHaveLength(7);
    expect(days[0]).toHaveAccessibleName('segunda-feira, 12 de janeiro');
    const tuesday = screen.getByRole('region', { name: 'terça-feira, 13 de janeiro' });
    expect(within(tuesday).getByText('23:30–00:30 · Massagem')).toBeInTheDocument();
  });
});
