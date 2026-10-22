import { assertSuccess, toApiError } from './errors.js';

/** Default timeout for IAM requests (milliseconds). */
export const DEFAULT_IAM_TIMEOUT_MS = 30_000;

interface IamResponse<T = unknown> {
  code: unknown;
  message?: string;
  msg?: string;
  data: T;
}

export interface ProxyLoginResult {
  userId: number;
  username: string;
  nickname: string;
  token: string;
  tokenType: string;
  expiresIn: number;
}

export interface AppTokenResult {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

/** User profile returned by the IAM `/user/me` endpoint. */
export interface UserInfo {
  id?: number;
  sub?: string;
  userId?: number;
  username?: string;
  preferred_username?: string;
  nickname?: string;
  name?: string;
  email?: string;
  mobile?: string;
  phone_number?: string;
  avatar?: string;
  userType?: string;
  [key: string]: unknown;
}

interface IamRequestOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

interface IamRawResponse {
  body: unknown;
  status: number;
  text: string;
}

async function requestIam(url: string, options: IamRequestOptions = {}): Promise<IamRawResponse> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_IAM_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
    });

    const text = await response.text();
    let body: unknown = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        // Non-JSON response (HTML, empty body, gateway error page, ...)
      }
    }

    return { body, status: response.status, text };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`IAM request timed out (${timeoutMs}ms): ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getAppToken(
  iamBaseUrl: string,
  clientId: string,
  clientSecret: string,
  timeoutMs?: number,
): Promise<string> {
  const { body, status, text } = await requestIam(`${iamBaseUrl}/exmay/iam/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials&scope=developer:proxy+read+write',
    timeoutMs,
  });

  if (status >= 400) {
    const apiError = toApiError(body, status);
    if (apiError) throw apiError;
    throw new Error(`Failed to get app token: ${status} ${text}`);
  }

  return (body as AppTokenResult).access_token;
}

export async function proxyLogin(opts: {
  iamBaseUrl: string;
  appAccessToken: string;
  clientId: string;
  username: string;
  password: string;
  appId: string;
  timeoutMs?: number;
}): Promise<ProxyLoginResult> {
  const { body, status } = await requestIam(`${opts.iamBaseUrl}/exmay/authority/api/iam/developer/proxy/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.appAccessToken}`,
      'Client-Id': opts.clientId,
    },
    body: JSON.stringify({
      username: opts.username,
      password: opts.password,
    }),
    timeoutMs: opts.timeoutMs,
  });

  assertSuccess(body, status, 'Proxy login failed');
  return (body as IamResponse<ProxyLoginResult>).data;
}

export async function proxyRegister(opts: {
  iamBaseUrl: string;
  appAccessToken: string;
  clientId: string;
  username: string;
  password: string;
  nickname?: string;
  mobile?: string;
  appId: string;
  timeoutMs?: number;
}): Promise<ProxyLoginResult> {
  const { body, status } = await requestIam(
    `${opts.iamBaseUrl}/exmay/authority/api/iam/developer/proxy/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.appAccessToken}`,
        'Client-Id': opts.clientId,
      },
      body: JSON.stringify({
        username: opts.username,
        password: opts.password,
        nickname: opts.nickname,
        mobile: opts.mobile,
      }),
      timeoutMs: opts.timeoutMs,
    },
  );

  assertSuccess(body, status, 'Proxy register failed');
  return (body as IamResponse<ProxyLoginResult>).data;
}

export async function proxyForgotPassword(opts: {
  iamBaseUrl: string;
  appAccessToken: string;
  clientId: string;
  username: string;
  password: string;
  appId: string;
  timeoutMs?: number;
}): Promise<void> {
  const { body, status } = await requestIam(
    `${opts.iamBaseUrl}/exmay/authority/api/iam/developer/proxy/forgot-password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.appAccessToken}`,
        'Client-Id': opts.clientId,
      },
      body: JSON.stringify({
        username: opts.username,
        password: opts.password,
      }),
      timeoutMs: opts.timeoutMs,
    },
  );

  assertSuccess(body, status, 'Proxy forgot-password failed');
}

export async function directLogin(
  baseUrl: string,
  username: string,
  password: string,
  timeoutMs?: number,
): Promise<{ access_token: string; expires_in: number }> {
  const { body, status } = await requestIam(`${baseUrl}/exmay/api/ums/member/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    timeoutMs,
  });

  assertSuccess(body, status, 'Login failed');
  return (body as IamResponse<{ access_token: string; expires_in: number }>).data;
}

export async function getUserInfo(
  iamBaseUrl: string,
  token: string,
  appId?: string,
  timeoutMs?: number,
): Promise<UserInfo> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (appId) {
    headers['App-Id'] = appId;
  }

  const { body, status } = await requestIam(`${iamBaseUrl}/exmay/authority/api/iam/user/me`, {
    method: 'GET',
    headers,
    timeoutMs,
  });

  assertSuccess(body, status, 'Failed to get user info');
  return (body as IamResponse<UserInfo>).data;
}
