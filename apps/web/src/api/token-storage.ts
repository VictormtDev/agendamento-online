const TOKEN_KEY = 'agendamento.accessToken';

// localStorage keeps the session across reloads; the trade-off is that a script injected
// through XSS could read it. An httpOnly cookie with refresh tokens is the planned upgrade.
export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
};
