import { PostbotClient } from './client.js';
import type { PaginatedResult } from './task.js';

/** SessionBot 会话 Cookie（常见字段，其余字段原样保留） */
export interface SessionCookie {
  name?: string;
  value?: string;
  domain?: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
  expires?: number;
  [key: string]: unknown;
}

/** SessionBot 会话 Storage 项（常见字段，其余字段原样保留） */
export interface SessionStorage {
  name?: string;
  key?: string;
  value?: unknown;
  [key: string]: unknown;
}

/** SessionBot 会话（用户端只读视图） */
export interface Session {
  id?: number;
  bizId: string;
  alias?: string;
  domain?: string;
  domainPattern?: string;
  groupId?: string;
  tags?: string[];
  color?: string;
  cookies?: SessionCookie[];
  storages?: SessionStorage[];
  userType?: string;
  userId?: number;
  createTime?: string;
}

/**
 * SessionBot 会话 API（用户端）。
 * `load` 使用业务 ID（bizId），而不是数据库主键 ID。
 */
export class SessionApi {
  private client: PostbotClient;

  constructor(client: PostbotClient) {
    this.client = client;
  }

  async listPaged(params: { page?: number; size?: number } = {}): Promise<PaginatedResult<Session>> {
    const response = await this.client.get<PaginatedResult<Session>>('/sessionbot/session/list', {
      page: String(params.page || 1),
      size: String(params.size || 20),
    });
    return response.data;
  }

  async list(): Promise<Session[]> {
    const response = await this.client.get<Session[]>('/sessionbot/session/listing');
    return response.data ?? [];
  }

  /** 按 SessionBot 业务 ID 加载会话 */
  async get(bizId: string): Promise<Session> {
    const response = await this.client.get<Session>('/sessionbot/session/load', { id: bizId });
    return response.data;
  }
}
