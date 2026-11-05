import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { User } from '../api/auth';
import type { AvailabilityWindow, TimeOff } from '../api/schedule';
import { mockFetch } from '../test/mock-fetch';
import { renderApp } from '../test/render-app';

const provider: User = {
  id: 'b6f0c1a2-0000-4000-8000-0000000000aa',
  name: 'Ana Souza',
  email: 'ana@example.com',
  role: 'PROVIDER',
  timezone: 'America/Sao_Paulo',
  createdAt: '2026-11-01T12:00:00.000Z',
};

const vacation: TimeOff = {
  id: 'time-off-1',
  startsAt: '2099-12-20T12:00:00.000Z',
  endsAt: '2099-12-27T12:00:00.000Z',
  reason: 'Férias',
};

function sentBody(fetchMock: ReturnType<typeof mockFetch>, method: string): unknown {
  const call = fetchMock.mock.calls.find(([, init]) => init?.method === method);
  // The client always sends JSON strings, never other body types.
  return JSON.parse(call?.[1]?.body as string);
}

describe('provider schedule', () => {
  let grid: AvailabilityWindow[];
  let timeOffs: TimeOff[];

  beforeEach(() => {
    localStorage.setItem('agendamento.accessToken', 'token-123');
    grid = [{ weekday: 1, startTime: '09:00', endTime: '12:00' }];
    timeOffs = [vacation];
  });

  // Read on each call, so the screen reflects the changes made during the test.
  const baseRoutes = () => ({
    'GET /api/v1/me': { status: 200, body: { user: provider } },
    'GET /api/v1/availability': () => ({ status: 200, body: { availability: grid } }),
    'GET /api/v1/time-off': () => ({ status: 200, body: { timeOffs } }),
  });

  it('should show the saved grid by weekday, Monday first', async () => {
    mockFetch(baseRoutes());
    renderApp('/dashboard/availability');

    const monday = await screen.findByRole('region', { name: 'Segunda-feira' });
    expect(within(monday).getByLabelText('Início')).toHaveValue('09:00');
    expect(within(monday).getByLabelText('Fim')).toHaveValue('12:00');
    const days = screen.getAllByRole('region');
    expect(days[0]).toHaveAccessibleName('Segunda-feira');
    expect(days[6]).toHaveAccessibleName('Domingo');
    const sunday = screen.getByRole('region', { name: 'Domingo' });
    expect(within(sunday).getByText('Sem atendimento.')).toBeInTheDocument();
  });

  it('should save the whole week in one request', async () => {
    const fetchMock = mockFetch({
      ...baseRoutes(),
      'PUT /api/v1/availability': { status: 200, body: { availability: [] } },
    });
    renderApp('/dashboard/availability');

    const wednesday = await screen.findByRole('region', { name: 'Quarta-feira' });
    await userEvent.click(within(wednesday).getByRole('button', { name: 'Adicionar horário' }));
    fireEvent.change(within(wednesday).getByLabelText('Fim'), { target: { value: '18:00' } });
    const monday = screen.getByRole('region', { name: 'Segunda-feira' });
    await userEvent.click(within(monday).getByRole('button', { name: 'Remover horário' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar grade' }));

    expect(await screen.findByText('Grade salva.')).toBeInTheDocument();
    expect(sentBody(fetchMock, 'PUT')).toEqual({
      windows: [{ weekday: 3, startTime: '09:00', endTime: '18:00' }],
    });
  });

  it('should show why the API refused the grid', async () => {
    mockFetch({
      ...baseRoutes(),
      'PUT /api/v1/availability': {
        status: 400,
        body: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados inválidos',
            details: {
              issues: [{ path: 'windows', message: 'Há janelas sobrepostas no mesmo dia' }],
            },
          },
        },
      },
    });
    renderApp('/dashboard/availability');

    const monday = await screen.findByRole('region', { name: 'Segunda-feira' });
    await userEvent.click(within(monday).getByRole('button', { name: 'Adicionar horário' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar grade' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Dados inválidos');
    expect(alert).toHaveTextContent('Há janelas sobrepostas no mesmo dia');
  });

  it('should list the time offs in the provider timezone', async () => {
    mockFetch(baseRoutes());
    renderApp('/dashboard/availability');

    expect(
      await screen.findByText(
        'domingo, 20 de dezembro de 2099 às 09:00 até domingo, 27 de dezembro de 2099 às 09:00',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Férias')).toBeInTheDocument();
  });

  it('should create a time off reading the times in the provider timezone', async () => {
    timeOffs = [];
    const fetchMock = mockFetch({
      ...baseRoutes(),
      'POST /api/v1/time-off': () => {
        timeOffs = [vacation];
        return { status: 201, body: { timeOff: vacation } };
      },
    });
    renderApp('/dashboard/availability');

    // Native date pickers cannot be typed into in jsdom; change is what the browser fires.
    fireEvent.change(await screen.findByLabelText('Início da folga'), {
      target: { value: '2099-12-20T09:00' },
    });
    fireEvent.change(screen.getByLabelText('Fim da folga'), {
      target: { value: '2099-12-27T09:00' },
    });
    await userEvent.type(screen.getByLabelText('Motivo (opcional)'), 'Férias');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar folga' }));

    expect(await screen.findByText('Férias')).toBeInTheDocument();
    expect(sentBody(fetchMock, 'POST')).toEqual({
      startsAt: '2099-12-20T12:00:00.000Z',
      endsAt: '2099-12-27T12:00:00.000Z',
      reason: 'Férias',
    });
  });

  it('should ask for both dates before calling the API', async () => {
    const fetchMock = mockFetch(baseRoutes());
    renderApp('/dashboard/availability');

    await userEvent.click(await screen.findByRole('button', { name: 'Adicionar folga' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Informe o início e o fim da folga.');
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('should remove a time off', async () => {
    mockFetch({
      ...baseRoutes(),
      'DELETE /api/v1/time-off/time-off-1': () => {
        timeOffs = [];
        return { status: 204, body: null };
      },
    });
    renderApp('/dashboard/availability');

    await userEvent.click(await screen.findByRole('button', { name: 'Remover folga' }));

    expect(await screen.findByText('Nenhuma folga marcada.')).toBeInTheDocument();
  });
});
