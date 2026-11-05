import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { User } from '../../api/auth';
import { apiError, mockFetch } from '../../test/mock-fetch';
import { renderApp } from '../../test/render-app';

const TOKEN_KEY = 'agendamento.accessToken';

// Signing in lands on the provider list, which is not under test here.
const providerList = {
  'GET /api/v1/providers?page=1&perPage=12': {
    status: 200,
    body: { data: [], meta: { page: 1, perPage: 12, total: 0 } },
  },
};

const user: User = {
  id: 'b6f0c1a2-0000-4000-8000-000000000001',
  name: 'Carla Dias',
  email: 'carla@example.com',
  role: 'CLIENT',
  timezone: 'America/Sao_Paulo',
  createdAt: '2026-11-01T12:00:00.000Z',
};

function sentBody(fetchMock: ReturnType<typeof mockFetch>, call = 0): unknown {
  const init = fetchMock.mock.calls[call]?.[1];
  // The client always sends JSON strings, never other body types.
  return JSON.parse(init?.body as string);
}

describe('authentication flow', () => {
  it('should send a visitor of a protected page to the login page', async () => {
    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  describe('login', () => {
    it('should sign in, store the token and show the home page', async () => {
      const fetchMock = mockFetch({
        ...providerList,
        'POST /api/v1/auth/login': { status: 200, body: { user, accessToken: 'token-123' } },
      });
      renderApp('/login');

      await userEvent.type(screen.getByLabelText('E-mail'), 'carla@example.com');
      await userEvent.type(screen.getByLabelText('Senha'), 'secret123');
      await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

      expect(await screen.findByText('Olá, Carla Dias')).toBeInTheDocument();
      expect(sentBody(fetchMock)).toEqual({ email: 'carla@example.com', password: 'secret123' });
      expect(localStorage.getItem(TOKEN_KEY)).toBe('token-123');
    });

    it('should show the API message for wrong credentials', async () => {
      mockFetch({
        'POST /api/v1/auth/login': apiError(
          401,
          'INVALID_CREDENTIALS',
          'E-mail ou senha inválidos',
        ),
      });
      renderApp('/login');

      await userEvent.type(screen.getByLabelText('E-mail'), 'carla@example.com');
      await userEvent.type(screen.getByLabelText('Senha'), 'wrong-pass');
      await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos');
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('should not call the API when the form is invalid', async () => {
      const fetchMock = mockFetch({});
      renderApp('/login');

      await userEvent.type(screen.getByLabelText('E-mail'), 'not-an-email');
      await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

      expect(await screen.findByText('Informe um e-mail válido')).toBeInTheDocument();
      expect(screen.getByText('Informe sua senha')).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    async function fillRegisterForm() {
      await userEvent.type(screen.getByLabelText('Nome'), 'Bruno Lima');
      await userEvent.type(screen.getByLabelText('E-mail'), 'bruno@example.com');
      await userEvent.type(screen.getByLabelText('Senha'), 'secret123');
    }

    it('should create a provider account and sign in', async () => {
      const provider: User = { ...user, name: 'Bruno Lima', role: 'PROVIDER' };
      const fetchMock = mockFetch({
        ...providerList,
        'POST /api/v1/auth/register': {
          status: 201,
          body: { user: provider, accessToken: 'token-456' },
        },
      });
      renderApp('/register');

      await fillRegisterForm();
      await userEvent.click(screen.getByLabelText('Sou profissional e ofereço serviços'));
      await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

      expect(await screen.findByText('Olá, Bruno Lima')).toBeInTheDocument();
      expect(sentBody(fetchMock)).toEqual({
        name: 'Bruno Lima',
        email: 'bruno@example.com',
        password: 'secret123',
        role: 'PROVIDER',
      });
    });

    it('should show the field errors and not call the API', async () => {
      const fetchMock = mockFetch({});
      renderApp('/register');

      await userEvent.type(screen.getByLabelText('Senha'), 'short');
      await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

      expect(await screen.findByText('Informe seu nome')).toBeInTheDocument();
      expect(screen.getByText('Informe um e-mail válido')).toBeInTheDocument();
      expect(screen.getByText('A senha precisa de pelo menos 8 caracteres')).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should show the API message when the e-mail is taken', async () => {
      mockFetch({
        'POST /api/v1/auth/register': apiError(409, 'EMAIL_ALREADY_IN_USE', 'E-mail já cadastrado'),
      });
      renderApp('/register');

      await fillRegisterForm();
      await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('E-mail já cadastrado');
    });
  });

  describe('session', () => {
    it('should restore the session from the stored token', async () => {
      localStorage.setItem(TOKEN_KEY, 'token-123');
      const fetchMock = mockFetch({
        ...providerList,
        'GET /api/v1/me': { status: 200, body: { user } },
      });
      renderApp('/');

      expect(await screen.findByText('Olá, Carla Dias')).toBeInTheDocument();
      expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
        Authorization: 'Bearer token-123',
      });
    });

    it('should drop an expired token and go to the login page', async () => {
      localStorage.setItem(TOKEN_KEY, 'expired');
      mockFetch({ 'GET /api/v1/me': apiError(401, 'INVALID_TOKEN', 'Token inválido ou expirado') });
      renderApp('/');

      expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('should sign out and return to the login page', async () => {
      localStorage.setItem(TOKEN_KEY, 'token-123');
      mockFetch({ ...providerList, 'GET /api/v1/me': { status: 200, body: { user } } });
      renderApp('/');

      await userEvent.click(await screen.findByRole('button', { name: 'Sair' }));

      expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('should keep a signed-in user out of the login page', async () => {
      localStorage.setItem(TOKEN_KEY, 'token-123');
      mockFetch({ ...providerList, 'GET /api/v1/me': { status: 200, body: { user } } });
      renderApp('/login');

      expect(await screen.findByText('Olá, Carla Dias')).toBeInTheDocument();
    });
  });
});
