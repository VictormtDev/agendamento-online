import { vi } from 'vitest';

interface MockResponse {
  status: number;
  body: unknown;
}

/**
 * Replaces fetch with canned answers keyed by "METHOD /path", so tests exercise the
 * real HTTP client. An unexpected request answers 500 naming itself, so a failing
 * test shows which call was not mocked.
 */
export function mockFetch(routes: Record<string, MockResponse>) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url}`;
    const { status, body } =
      routes[key] ?? apiError(500, 'UNMOCKED_REQUEST', `Unexpected request: ${key}`);
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function apiError(status: number, code: string, message: string): MockResponse {
  return { status, body: { error: { code, message, details: {} } } };
}
