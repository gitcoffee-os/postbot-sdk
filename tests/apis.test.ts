import { afterEach, describe, expect, it, vi } from 'vitest';
import { PostbotClient } from '../src/api/client.js';
import { TaskApi } from '../src/api/task.js';
import { AutoPublishApi } from '../src/api/autopublish.js';
import { WorkflowApi } from '../src/api/workflow.js';
import { FingerprintApi } from '../src/api/fingerprint.js';
import { NotifyApi } from '../src/api/notify.js';
import { SessionApi } from '../src/api/session.js';
import { installFetchMock, jsonResponse } from './helpers.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function createClient() {
  return new PostbotClient({
    baseUrl: 'https://api.example.com',
    appId: 'app-1',
    token: 'token-1',
  });
}

function lastCall(fetchMock: ReturnType<typeof installFetchMock>) {
  const call = fetchMock.mock.calls.at(-1);
  if (!call) throw new Error('fetch was not called');
  return { url: new URL(String(call[0])), init: call[1] as RequestInit };
}

describe('TaskApi', () => {
  it('lists tasks with pagination and status filters', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(
      jsonResponse({
        code: 'SUCCESS',
        data: { list: [], total: 0, current: 2, size: 5, pages: 0 },
      }),
    );

    const result = await new TaskApi(createClient()).list({ page: 2, size: 5, status: 'FAILED' });

    const { url, init } = lastCall(fetchMock);
    expect(url.pathname).toBe('/postbot/media/task/list');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('size')).toBe('5');
    expect(url.searchParams.get('status')).toBe('FAILED');
    expect(init.method).toBe('GET');
    expect(result.current).toBe(2);
  });

  it('creates, updates and removes tasks', async () => {
    const fetchMock = installFetchMock()
      .mockResolvedValueOnce(jsonResponse({ code: 'SUCCESS', data: { id: 7 } }))
      .mockResolvedValueOnce(jsonResponse({ code: 'SUCCESS', data: { id: 7, name: 'new' } }))
      .mockResolvedValueOnce(jsonResponse({ code: 'SUCCESS', data: null }));

    const api = new TaskApi(createClient());

    await api.create({ name: 'demo', platformCodes: ['weixin'] });
    expect(lastCall(fetchMock).init).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ name: 'demo', platformCodes: ['weixin'] }),
    });

    await api.update(7, { name: 'new' });
    expect(lastCall(fetchMock).init).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ id: 7, name: 'new' }),
    });

    await api.delete(7);
    expect(lastCall(fetchMock).init).toMatchObject({ method: 'DELETE', body: JSON.stringify({ id: 7 }) });
  });

  it('sends ids as a comma-separated query parameter for batch removal', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(jsonResponse({ code: 'SUCCESS', data: null }));

    await new TaskApi(createClient()).batchDelete([1, 2, 3]);

    const { url, init } = lastCall(fetchMock);
    expect(url.pathname).toBe('/postbot/media/task/batch_remove');
    expect(url.searchParams.get('ids')).toBe('1,2,3');
    expect(init.method).toBe('DELETE');
  });

  it('binds a content id idempotently', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(jsonResponse({ code: 'SUCCESS', data: 'content-1' }));

    const bound = await new TaskApi(createClient()).bindContent(7, 'content-1');

    expect(bound).toBe('content-1');
    expect(lastCall(fetchMock).init).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ taskId: 7, contentId: 'content-1' }),
    });
  });

  it('returns an empty array when listAll has no data', async () => {
    installFetchMock().mockResolvedValue(jsonResponse({ code: 'SUCCESS', data: null }));

    await expect(new TaskApi(createClient()).listAll()).resolves.toEqual([]);
  });
});

describe('AutoPublishApi', () => {
  it('triggers publishing for a task', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(jsonResponse({ code: 'SUCCESS', data: null }));

    await new AutoPublishApi(createClient()).trigger(42);

    const { url, init } = lastCall(fetchMock);
    expect(url.pathname).toBe('/postbot/autopublish/task/42/trigger');
    expect(init.method).toBe('POST');
  });

  it('returns null when a task has no job yet', async () => {
    installFetchMock().mockResolvedValue(jsonResponse({ code: 'SUCCESS', data: null }));

    await expect(new AutoPublishApi(createClient()).getStatus(42)).resolves.toBeNull();
  });

  it('filters and limits jobs client-side', async () => {
    installFetchMock().mockResolvedValue(
      jsonResponse({
        code: 'SUCCESS',
        data: [
          { id: 1, taskId: 1, status: 'SUCCESS' },
          { id: 2, taskId: 2, status: 'FAILED' },
          { id: 3, taskId: 2, status: 'FAILED' },
        ],
      }),
    );

    const jobs = await new AutoPublishApi(createClient()).listJobs({ taskId: 2, status: 'FAILED', limit: 1 });

    expect(jobs).toEqual([{ id: 2, taskId: 2, status: 'FAILED' }]);
  });
});

describe('WorkflowApi', () => {
  it('executes a workflow and reads its status', async () => {
    const fetchMock = installFetchMock()
      .mockResolvedValueOnce(jsonResponse({ code: 'SUCCESS', data: { executionId: 'exec-1', status: 'RUNNING' } }))
      .mockResolvedValueOnce(jsonResponse({ code: 'SUCCESS', data: { executionId: 'exec-1', status: 'SUCCESS' } }));

    const api = new WorkflowApi(createClient());

    await api.executeWorkflow('PUBLISH', { taskId: 1 });
    expect(lastCall(fetchMock).init).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ workflowType: 'PUBLISH', input: { taskId: 1 } }),
    });

    const status = await api.getExecutionStatus('exec-1');
    expect(lastCall(fetchMock).url.pathname).toBe('/workflow/execution/exec-1');
    expect(status.status).toBe('SUCCESS');
  });
});

describe('FingerprintApi', () => {
  it('removes a fingerprint by mediaAccountId', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(jsonResponse({ code: 'SUCCESS', data: null }));

    await new FingerprintApi(createClient()).remove(9);

    const { url, init } = lastCall(fetchMock);
    expect(url.pathname).toBe('/postbot/media/account/fingerprint/remove');
    expect(url.searchParams.get('mediaAccountId')).toBe('9');
    expect(init.method).toBe('DELETE');
  });
});

describe('SessionApi', () => {
  it('loads a session by business id', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(
      jsonResponse({ code: 'SUCCESS', data: { bizId: 'biz-1' } }),
    );

    const session = await new SessionApi(createClient()).get('biz-1');

    const { url } = lastCall(fetchMock);
    expect(url.pathname).toBe('/sessionbot/session/load');
    expect(url.searchParams.get('id')).toBe('biz-1');
    expect(session.bizId).toBe('biz-1');
  });
});

describe('NotifyApi', () => {
  it('forwards an optional Client-Id header', async () => {
    const fetchMock = installFetchMock().mockResolvedValue(jsonResponse({ code: 'SUCCESS', data: null }));

    await new NotifyApi(createClient()).send({ event: 'userProxyRenewal', info: { userId: 1 } }, 'client-9');

    const { url, init } = lastCall(fetchMock);
    expect(url.pathname).toBe('/postbot/notify');
    expect(init.headers).toMatchObject({ 'Client-Id': 'client-9' });
    expect(init.body).toBe(JSON.stringify({ event: 'userProxyRenewal', info: { userId: 1 } }));
  });
});
