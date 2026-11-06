import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { User } from '../api/auth';
import { mockFetch } from '../test/mock-fetch';
import { renderApp } from '../test/render-app';

const user: User = {
  id: 'b6f0c1a2-0000-4000-8000-000000000001',
  name: 'Carla Dias',
  email: 'carla@example.com',
  role: 'CLIENT',
  timezone: 'America/Sao_Paulo',
  createdAt: '2026-11-01T12:00:00.000Z',
};

const emptyPage = { status: 200, body: { data: [], meta: { page: 1, perPage: 10, total: 0 } } };

describe('app layout', () => {
  beforeEach(() => {
    localStorage.setItem('agendamento.accessToken', 'token-123');
    mockFetch({
      'GET /api/v1/me': { status: 200, body: { user } },
      'GET /api/v1/providers?page=1&perPage=12': emptyPage,
      'GET /api/v1/appointments?page=1&perPage=10': emptyPage,
    });
  });

  it('should open the mobile menu and close it after navigating', async () => {
    renderApp('/providers');
    const toggle = await screen.findByRole('button', { name: 'Abrir menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(toggle);

    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    const links = screen.getAllByRole('link', { name: 'Meus agendamentos' });
    expect(links).toHaveLength(2);
    const menuLink = links[1];
    if (!menuLink) {
      throw new Error('The menu should repeat the navigation links');
    }

    await userEvent.click(menuLink);

    expect(screen.getAllByRole('link', { name: 'Meus agendamentos' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument();
  });
});
