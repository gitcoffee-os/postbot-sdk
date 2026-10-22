/**
 * 统一 API 错误（携带分级错误码）
 *
 * 协议约定：
 * - 部分端点即使业务失败也返回 HTTP 200 + `{code, msg, data}`，`code` 为字符串业务码
 *   （`SUCCESS` / `NOT_LOGIN` / `DEVELOPER.TOKEN_EXPIRED` / `USER.TOKEN_EXPIRED` 等）
 * - 部分历史端点使用数值码（`0` 成功 / `500` 失败）
 *
 * 本模块统一收敛：成功 = `isSuccessCode(code)`，失败抛出 {@link IamApiError}（携带 code），
 * 供 CLI 按 `code.startsWith("DEVELOPER."|"USER."|"DELEGATION.")` 分类提示。
 */
export class IamApiError extends Error {
  /** 业务码（分级码 / 粗码 / 数值码），无法提取时为 null */
  readonly code: string | number | null;
  /** HTTP 状态码（0 表示解析前未知） */
  readonly status: number;

  constructor(
    message: string,
    options?: { code?: string | number | null; status?: number; cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'IamApiError';
    this.code = options?.code ?? null;
    this.status = options?.status ?? 0;
  }
}

/** 语义成功判定：兼容字符串码（SUCCESS）与历史数值码（0），无 code 字段视为成功 */
export function isSuccessCode(code: unknown): boolean {
  return code === undefined || code === null || code === 'SUCCESS' || code === 0 || code === '0';
}

/**
 * 从响应体提取统一错误；非失败响应返回 null。
 * 兼容三种结构：
 * - `{code: "DEVELOPER.TOKEN_EXPIRED", msg}`
 * - `{code: 500, message}`
 * - RFC 风格 `{error, error_code, error_description}`
 */
export function toApiError(body: unknown, status: number): IamApiError | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  // RFC 8693 风格（token-exchange）
  if (typeof b.error === 'string') {
    const description = typeof b.error_description === 'string' ? b.error_description : b.error;
    const code = typeof b.error_code === 'string' || typeof b.error_code === 'number' ? b.error_code : b.error;
    return new IamApiError(description, { code, status });
  }

  const code = typeof b.code === 'string' || typeof b.code === 'number' ? b.code : null;
  if (code === null || isSuccessCode(code)) return null;

  const rawMessage = typeof b.msg === 'string' ? b.msg : b.message;
  const message = typeof rawMessage === 'string' && rawMessage ? rawMessage : '请求失败';
  return new IamApiError(message, { code, status });
}

/** 断言响应成功，失败抛出 IamApiError */
export function assertSuccess(body: unknown, status: number, fallbackMessage: string): void {
  const apiError = toApiError(body, status);
  if (apiError) throw apiError;
  if (status >= 400) {
    throw new IamApiError(`HTTP ${status}: ${fallbackMessage}`, { status });
  }
}
