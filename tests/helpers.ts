import { vi } from 'vitest';

export function jsonResponse(body: unknown, status = 200): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => JSON.stringify(body),
  } as Response;
}

export function textResponse(text: string, status = 200): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => text,
  } as Response;
}

export function installFetchMock() {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function abortError(): Error {
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  return error;
}
