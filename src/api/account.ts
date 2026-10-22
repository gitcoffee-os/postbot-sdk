import { PostbotClient } from './client.js';
import type { PaginatedResult } from './task.js';

/** 引擎媒体账号实体 */
export interface Account {
  id: number;
  username: string;
  accountId?: string;
  name: string;
  profile?: string;
  avatar?: string;
  homepage?: string;
  url?: string;
  /** ok / renew / expired / unbound（引擎按会话 Cookie 有效期计算） */
  status: string;
  mediaPlatformId: number;
  sessionbotSessionId?: number;
  proxybotProfileId?: number;
  userType?: string;
  userId?: number;
  createTime?: string;
  /** 引擎列表/详情会批量填充关联会话 */
  session?: Record<string, unknown> | null;
}

export interface AccountListParams {
  mediaPlatformId?: number;
  status?: string;
  search?: string;
}

export interface AccountSaveRequest extends Partial<Account> {
  id?: number;
}

export class AccountApi {
  private client: PostbotClient;

  constructor(client: PostbotClient) {
    this.client = client;
  }

  /** 分页查询账号（引擎 /list） */
  async listPaged(params: AccountListParams & { page?: number; size?: number } = {}): Promise<PaginatedResult<Account>> {
    const response = await this.client.get<PaginatedResult<Account>>('/postbot/media/account/list', {
      page: String(params.page || 1),
      size: String(params.size || 20),
      ...toQuery(params),
    });
    return response.data;
  }

  /** 查询全部账号（引擎 /listing，不分页） */
  async list(params: AccountListParams = {}): Promise<Account[]> {
    const response = await this.client.get<Account[]>('/postbot/media/account/listing', toQuery(params));
    return response.data ?? [];
  }

  /** 加载单个账号（引擎 /load） */
  async get(id: number): Promise<Account> {
    const response = await this.client.get<Account>('/postbot/media/account/load', { id: String(id) });
    return response.data;
  }

  /** 按 SessionBot 会话查询账号（引擎 /find_by_session，一对一） */
  async findBySession(sessionbotSessionId: number): Promise<Account | null> {
    const response = await this.client.get<Account | null>('/postbot/media/account/find_by_session', {
      sessionbotSessionId: String(sessionbotSessionId),
    });
    return response.data ?? null;
  }

  /** 保存账号（引擎 /save，无返回体） */
  async save(data: AccountSaveRequest): Promise<void> {
    await this.client.post('/postbot/media/account/save', data);
  }

  /** 更新账号（引擎 /update，无返回体） */
  async update(id: number, data: AccountSaveRequest): Promise<void> {
    await this.client.put('/postbot/media/account/update', { id, ...data });
  }

  /** 删除账号（引擎 /remove） */
  async remove(id: number): Promise<void> {
    await this.client.delete('/postbot/media/account/remove', { id });
  }

  /** 批量删除账号（引擎 /batch_remove，ids 为查询参数） */
  async batchRemove(ids: number[]): Promise<void> {
    await this.client.request('/postbot/media/account/batch_remove', {
      method: 'DELETE',
      params: { ids: ids.join(',') },
    });
  }
}

function toQuery(params: AccountListParams): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.mediaPlatformId !== undefined && params.mediaPlatformId !== null) {
    query.mediaPlatformId = String(params.mediaPlatformId);
  }
  if (params.status) query.status = params.status;
  if (params.search) query.search = params.search;
  return query;
}
