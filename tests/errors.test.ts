import { describe, expect, it } from 'vitest';
import { IamApiError, isSuccessCode, toApiError } from '../src/api/errors.js';
import { assertSuccess } from '../src/api/errors.js';

describe('isSuccessCode', () => {
  it('accepts success codes used by the engine', () => {
    expect(isSuccessCode(undefined)).toBe(true);
    expect(isSuccessCode(null)).toBe(true);
    expect(isSuccessCode('SUCCESS')).toBe(true);
    expect(isSuccessCode(0)).toBe(true);
    expect(isSuccessCode('0')).toBe(true);
  });

  it('rejects business error codes', () => {
    expect(isSuccessCode('NOT_LOGIN')).toBe(false);
    expect(isSuccessCode('DEVELOPER.TOKEN_EXPIRED')).toBe(false);
    expect(isSuccessCode(500)).toBe(false);
  });
});

describe('toApiError', () => {
  it('returns null for successful responses', () => {
    expect(toApiError({ code: 'SUCCESS', data: {} }, 200)).toBeNull();
    expect(toApiError({ code: 0, data: {} }, 200)).toBeNull();
    expect(toApiError({}, 200)).toBeNull();
    expect(toApiError(null, 200)).toBeNull();
  });

  it('maps business codes to IamApiError', () => {
    const error = toApiError({ code: 'USER.TOKEN_EXPIRED', msg: '登录已过期' }, 200);

    expect(error).toBeInstanceOf(IamApiError);
    expect(error?.code).toBe('USER.TOKEN_EXPIRED');
    expect(error?.status).toBe(200);
    expect(error?.message).toBe('登录已过期');
  });

  it('supports message as a fallback for msg', () => {
    const error = toApiError({ code: 500, message: 'server error' }, 500);

    expect(error?.message).toBe('server error');
    expect(error?.code).toBe(500);
  });

  it('supports RFC style error payloads', () => {
    const error = toApiError(
      { error: 'invalid_client', error_code: 'AUTH.INVALID_CLIENT', error_description: 'bad credentials' },
      401,
    );

    expect(error?.message).toBe('bad credentials');
    expect(error?.code).toBe('AUTH.INVALID_CLIENT');
    expect(error?.status).toBe(401);
  });

  it('uses a default message when the server omits one', () => {
    expect(toApiError({ code: 'FAILED' }, 200)?.message).toBe('请求失败');
  });
});

describe('assertSuccess', () => {
  it('does nothing for successful bodies', () => {
    expect(() => assertSuccess({ code: 'SUCCESS' }, 200, 'failed')).not.toThrow();
  });

  it('throws for business errors', () => {
    expect(() => assertSuccess({ code: 'NOT_LOGIN', msg: 'not logged in' }, 200, 'failed')).toThrow(
      IamApiError,
    );
  });

  it('throws for HTTP errors without a JSON body', () => {
    expect(() => assertSuccess({}, 502, 'gateway down')).toThrow('HTTP 502: gateway down');
  });
});

describe('IamApiError', () => {
  it('keeps code, status and cause', () => {
    const cause = new Error('root cause');
    const error = new IamApiError('failed', { code: 'USER.NOT_FOUND', status: 404, cause });

    expect(error.name).toBe('IamApiError');
    expect(error.code).toBe('USER.NOT_FOUND');
    expect(error.status).toBe(404);
    expect(error.cause).toBe(cause);
  });

  it('defaults code and status when omitted', () => {
    const error = new IamApiError('failed');

    expect(error.code).toBeNull();
    expect(error.status).toBe(0);
  });
});
