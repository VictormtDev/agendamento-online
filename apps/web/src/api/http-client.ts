import { tokenStorage } from './token-storage';

const BASE_URL = '/api/v1';
const NO_CONTENT = 204;

/** An error answered by the API (or a failure to reach it), carrying the API error code. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** The paginated response shape of every API listing. */
export interface Page<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number };
}

interface ErrorBody {
  error?: { code?: string; message?: string };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStorage.get();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? null : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Não foi possível conectar ao servidor. Tente novamente.',
    );
  }

  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === NO_CONTENT) {
    return undefined as T;
  }
  // The response shape is the API contract, typed by the caller; it is not re-validated here.
  return (await response.json()) as T;
}

// The API already writes its messages in Portuguese, so they are shown as they come.
async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => ({}))) as ErrorBody;
  return new ApiError(
    response.status,
    body.error?.code ?? 'UNKNOWN_ERROR',
    body.error?.message ?? 'Algo deu errado. Tente novamente.',
  );
}
