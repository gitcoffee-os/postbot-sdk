import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_IAM_TIMEOUT_MS,
  directLogin,
  getAppToken,
  getUserInfo,
  proxyForgotPassword,
  proxyLogin,
  proxyRegister,
} from '../src/api/iam.js';
import { IamApiError } from '../src/api/errors.js';
import { abortError, installFetchMock, jsonResponse } from './helpers.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const IAM_BASE = 'https://iam.example.com';

describe('getAppToken', () => {
  it('requests a client-credentials token with HTTP Basic auth', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(
      jsonResponse({ access_token: 'app-token', token_type: 'Bearer', expires_in: 3600, scope: 'read' }),
    );

    const token = await getAppToken(IAM_BASE, 'client-id', 'client-secret');

    expect(token).toBe('app-token');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${IAM_BASE}/exmay/iam/oauth2/token`);
    expect(init).toMatchObject({
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`,
      },
      body: 'grant_type=client_credentials&scope=developer:proxy+read+write',
    });
  });

  it('throws IamApiError for OAuth error responses', async () => {
    installFetchMock().mockResolvedValue(
      jsonResponse({ error: 'invalid_client', error_description: 'bad credentials' }, 401),
    );

    await expect(getAppToken(IAM_BASE, 'client-id', 'wrong-secret')).rejects.toMatchObject({
      name: 'IamApiError',
      code: 'invalid_client',
      status: 401,
      message: 'bad credentials',
    });
  });

  it('throws a descriptive error for non-JSON failures', async () => {
    installFetchMock().mockResolvedValue({
      status: 503,
      ok: false,
      text: async () => 'Service Unavailable',
    } as Response);

    await expect(getAppToken(IAM_BASE, 'client-id', 'secret')).rejects.toThrow(
      'Failed to get app token: 503 Service Unavailable',
    );
  });
});

describe('proxyLogin', () => {
  const loginOptions = {
    iamBaseUrl: IAM_BASE,
    appAccessToken: 'app-token',
    clientId: 'client-id',
    username: 'alice',
    password: 'secret',
    appId: 'app-1',
  };

  it('returns the proxy login result', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(
      jsonResponse({
        code: 'SUCCESS',
        data: {
          userId: 1,
          username: 'alice',
          nickname: 'Alice',
          token: 'user-token',
          tokenType: 'Bearer',
          expiresIn: 7200,
        },
      }),
    );

    const result = await proxyLogin(loginOptions);

    expect(result.token).toBe('user-token');
    expect(fetchMock.mock.calls[0][0]).toBe(`${IAM_BASE}/exmay/authority/api/iam/developer/proxy/login`);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer app-token',
        'Client-Id': 'client-id',
      },
      body: JSON.stringify({ username: 'alice', password: 'secret' }),
    });
  });

  it('throws IamApiError when the delegated login fails', async () => {
    installFetchMock().mockResolvedValue(
      jsonResponse({ code: 'DELEGATION.INVALID_PASSWORD', msg: 'wrong password' }),
    );

    await expect(proxyLogin(loginOptions)).rejects.toBeInstanceOf(IamApiError);
  });
});

describe('proxyRegister', () => {
  it('sends optional profile fields', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(
      jsonResponse({
        code: 'SUCCESS',
        data: {
          userId: 2,
          username: 'bob',
          nickname: 'Bob',
          token: 'token',
          tokenType: 'Bearer',
          expiresIn: 7200,
        },
      }),
    );

    await proxyRegister({
      iamBaseUrl: IAM_BASE,
      appAccessToken: 'app-token',
      clientId: 'client-id',
      username: 'bob',
      password: 'secret',
      nickname: 'Bob',
      mobile: '13800000000',
      appId: 'app-1',
    });

    expect(fetchMock.mock.calls[0][0]).toBe(`${IAM_BASE}/exmay/authority/api/iam/developer/proxy/register`);
    expect(fetchMock.mock.calls[0][1].body).toBe(
      JSON.stringify({ username: 'bob', password: 'secret', nickname: 'Bob', mobile: '13800000000' }),
    );
  });
});

describe('proxyForgotPassword', () => {
  it('resolves for successful responses', async () => {
    installFetchMock().mockResolvedValue(jsonResponse({ code: 'SUCCESS', data: null }));

    await expect(
      proxyForgotPassword({
        iamBaseUrl: IAM_BASE,
        appAccessToken: 'app-token',
        clientId: 'client-id',
        username: 'alice',
        password: 'new-secret',
        appId: 'app-1',
      }),
    ).resolves.toBeUndefined();
  });
});

describe('directLogin', () => {
  it('posts credentials to the member login endpoint', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(
      jsonResponse({ code: 'SUCCESS', data: { access_token: 'direct-token', expires_in: 3600 } }),
    );

    const result = await directLogin('https://api.example.com', 'alice', 'secret');

    expect(result.access_token).toBe('direct-token');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/exmay/api/ums/member/login');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'secret' }),
    });
  });
});

describe('getUserInfo', () => {
  it('returns the profile and forwards App-Id when provided', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(
      jsonResponse({ code: 'SUCCESS', data: { username: 'alice', nickname: 'Alice' } }),
    );

    const user = await getUserInfo(IAM_BASE, 'user-token', 'app-1');

    expect(user).toMatchObject({ username: 'alice', nickname: 'Alice' });
    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      Authorization: 'Bearer user-token',
      'App-Id': 'app-1',
    });
  });

  it('omits App-Id when not provided', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(
      jsonResponse({ code: 'SUCCESS', data: { username: 'alice' } }),
    );

    await getUserInfo(IAM_BASE, 'user-token');

    expect(fetchMock.mock.calls[0][1].headers).toEqual({ Authorization: 'Bearer user-token' });
  });
});

describe('IAM timeouts', () => {
  it('aborts after the default timeout', async () => {
    installFetchMock().mockRejectedValue(abortError());

    await expect(getAppToken(IAM_BASE, 'client-id', 'secret')).rejects.toThrow(
      new RegExp(`IAM request timed out \\(${DEFAULT_IAM_TIMEOUT_MS}ms\\)`),
    );
  });

  it('supports a per-call timeout override', async () => {
    installFetchMock().mockRejectedValue(abortError());

    await expect(getUserInfo(IAM_BASE, 'token', undefined, 15)).rejects.toThrow(
      'IAM request timed out (15ms)',
    );
  });

  it('rethrows non-abort transport errors unchanged', async () => {
    const networkError = new Error('ECONNRESET');
    installFetchMock().mockRejectedValue(networkError);

    await expect(directLogin(IAM_BASE, 'alice', 'secret')).rejects.toBe(networkError);
  });
});
