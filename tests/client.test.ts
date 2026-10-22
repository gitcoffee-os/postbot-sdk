import { afterEach, describe, expect, it, vi } from 'vitest';
import { PostbotClient } from '../src/api/client.js';
import { IamApiError } from '../src/api/errors.js';
import { abortError, installFetchMock, jsonResponse, textResponse } from './helpers.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function createClient(token?: string) {
  return new PostbotClient({
    baseUrl: 'https://api.example.com/base',
    appId: 'app-1',
    token,
    timeoutMs: 1000,
  });
}

describe('PostbotClient', () => {
  it('joins base URL and endpoint without duplicating slashes', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(jsonResponse({ code: 'SUCCESS', data: [] }));

    await createClient('token-1').get('/postbot/media/task/list', { page: '2', size: '10' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.example.com/base/postbot/media/task/list?page=2&size=10');
    expect(init).toMatchObject({ method: 'GET' });
  });

  it('keeps an existing trailing slash on the base URL', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(jsonResponse({ code: 'SUCCESS', data: null }));
    const client = new PostbotClient({ baseUrl: 'https://api.example.com/base/', appId: 'app-1' });

    await client.get('postbot/notify');

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/base/postbot/notify');
  });

  it('sends App-Id and Bearer authorization headers', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(jsonResponse({ code: 'SUCCESS', data: null }));

    await createClient('token-1').get('/postbot/media/platform/listing');

    const init = fetchMock.mock.calls[0][1];
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      'App-Id': 'app-1',
      Authorization: 'Bearer token-1',
    });
  });

  it('picks up a token set after construction', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(jsonResponse({ code: 'SUCCESS', data: null }));
    const client = createClient();

    client.setToken('token-2');
    await client.get('/postbot/media/platform/listing');

    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Bearer token-2' });
  });

  it('lets callers override default headers', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(jsonResponse({ code: 'SUCCESS', data: null }));

    await createClient().request('/postbot/notify', {
      method: 'POST',
      headers: { 'Client-Id': 'client-9' },
      body: { event: 'test' },
    });

    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ 'Client-Id': 'client-9' });
  });

  it('serializes request bodies as JSON', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(jsonResponse({ code: 'SUCCESS', data: { id: 1 } }));

    await createClient().post('/postbot/media/task/save', { name: 'demo' });

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ name: 'demo' }),
    });
  });

  it('returns the parsed response body', async () => {
    installFetchMock().mockResolvedValue(jsonResponse({ code: 'SUCCESS', data: { total: 3 } }));

    const response = await createClient().get<{ total: number }>('/postbot/media/task/list');

    expect(response.data).toEqual({ total: 3 });
  });

  it('throws IamApiError for business failures returned with HTTP 200', async () => {
    installFetchMock().mockResolvedValue(
      jsonResponse({ code: 'DEVELOPER.TOKEN_EXPIRED', msg: 'token expired' }),
    );

    const promise = createClient().get('/postbot/media/task/list');

    await expect(promise).rejects.toBeInstanceOf(IamApiError);
    await expect(promise).rejects.toMatchObject({
      code: 'DEVELOPER.TOKEN_EXPIRED',
      status: 200,
      message: 'token expired',
    });
  });

  it('throws an HTTP error for non-JSON error responses', async () => {
    installFetchMock().mockResolvedValue(textResponse('Bad gateway', 502));

    await expect(createClient().get('/postbot/media/task/list')).rejects.toThrow('HTTP 502: Bad gateway');
  });

  it('falls back to an empty structure for empty bodies', async () => {
    installFetchMock().mockResolvedValue(textResponse(''));

    const response = await createClient().delete('/postbot/media/task/remove');

    expect(response).toEqual({ code: 'SUCCESS', data: null });
  });

  it('aborts requests after the configured timeout', async () => {
    installFetchMock().mockRejectedValue(abortError());

    await expect(createClient().get('/postbot/media/task/list')).rejects.toThrow(/请求超时（1000ms）/);
  });

  it('keeps the timeout active while reading the response body', async () => {
    installFetchMock().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => {
        throw abortError();
      },
    } as Response);

    await expect(createClient().get('/postbot/media/task/list')).rejects.toThrow(/请求超时（1000ms）/);
  });

  it('rethrows unexpected transport errors unchanged', async () => {
    const networkError = new Error('ECONNREFUSED');
    installFetchMock().mockRejectedValue(networkError);

    await expect(createClient().get('/postbot/media/task/list')).rejects.toBe(networkError);
  });
});
