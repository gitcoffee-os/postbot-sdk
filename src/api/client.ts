import { toApiError } from './errors.js';

export interface ApiResponse<T = unknown> {
  code: unknown;
  message?: string;
  msg?: string;
  data: T;
}

export interface RequestOptions {
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
}

export interface PostbotClientOptions {
  baseUrl: string;
  appId: string;
  token?: string;
  /** 单次请求超时（毫秒）。默认 30000。用于避免服务器慢响应/挂起时无限等待。 */
  timeoutMs?: number;
}

export class PostbotClient {
  private baseUrl: string;
  private appId: string;
  private token: string | null;
  private timeoutMs: number;

  constructor(options: PostbotClientOptions) {
    this.baseUrl = options.baseUrl;
    this.appId = options.appId;
    this.token = options.token || null;
    this.timeoutMs = options.timeoutMs ?? 30000;
  }

  setToken(token: string): void {
    this.token = token;
  }

  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'App-Id': this.appId,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }

    return headers;
  }

  async request<T = unknown>(endpoint: string, options: RequestOptions): Promise<ApiResponse<T>> {
    const baseWithSlash = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const url = new URL(endpoint.replace(/^\/+/, ''), baseWithSlash);

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: options.method,
        headers: this.buildHeaders(options.headers),
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      const text = await response.text();
      let body: unknown = {};
      let parsed = false;
      if (text) {
        try {
          body = JSON.parse(text);
          parsed = true;
        } catch {
          // 非 JSON 响应（HTML / 空串等），保留原始文本
        }
      }

      // 语义化校验：后端失败统一 HTTP 200 + {code,msg}，仅看 HTTP 状态会把失败响应误判为成功
      const apiError = toApiError(body, response.status);
      if (apiError) throw apiError;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
      }

      // 兜底：HTTP 2xx 但无法解析为对象时也返回空结构，避免调用方崩溃
      return (parsed && typeof body === 'object' && body !== null
        ? body
        : { code: 'SUCCESS', data: null }) as ApiResponse<T>;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`请求超时（${this.timeoutMs}ms）: ${url.toString()}`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T = unknown>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T = unknown>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T = unknown>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async delete<T = unknown>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', body });
  }
}
