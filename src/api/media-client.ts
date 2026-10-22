import { PostbotClient } from './client.js';
import type { PaginatedResult } from './task.js';

/**
 * 媒体客户端类型：
 * - browser_extension：已保存浏览器扩展
 * - browser_extension_ephemeral：未保存/临时浏览器
 * - desktop：桌面端
 * - cloud：云端发布器
 */
export type MediaClientType =
  | 'browser_extension'
  | 'browser_extension_ephemeral'
  | 'desktop'
  | 'cloud';

/** 引擎媒体客户端实体 */
export interface MediaClient {
  id: number;
  name: string;
  type: MediaClientType | string;
  clientKey: string;
  mediaPlatformId?: number;
  mediaAccountId?: number;
  sessionbotSessionId?: number;
  proxybotProfileId?: number;
  lastOnlineAt?: string;
  userType?: string;
  userId?: number;
}

export interface MediaClientSaveRequest extends Partial<MediaClient> {
  id?: number;
}

export class ClientApi {
  private client: PostbotClient;

  constructor(client: PostbotClient) {
    this.client = client;
  }

  /** 分页查询客户端（引擎 /list） */
  async listPaged(params: { page?: number; size?: number } = {}): Promise<PaginatedResult<MediaClient>> {
    const response = await this.client.get<PaginatedResult<MediaClient>>('/postbot/media/client/list', {
      page: String(params.page || 1),
      size: String(params.size || 20),
    });
    return response.data;
  }

  /** 查询全部客户端（引擎 /listing，不分页） */
  async list(): Promise<MediaClient[]> {
    const response = await this.client.get<MediaClient[]>('/postbot/media/client/listing');
    return response.data ?? [];
  }

  /** 加载单个客户端（引擎 /load） */
  async get(id: number): Promise<MediaClient> {
    const response = await this.client.get<MediaClient>('/postbot/media/client/load', { id: String(id) });
    return response.data;
  }

  /** 注册/保存客户端（引擎 /save，无返回体） */
  async register(data: MediaClientSaveRequest): Promise<void> {
    await this.client.post('/postbot/media/client/save', data);
  }

  /** 更新客户端（引擎 /update，无返回体） */
  async update(id: number, data: MediaClientSaveRequest): Promise<void> {
    await this.client.put('/postbot/media/client/update', { id, ...data });
  }

  /** 删除客户端（引擎 /remove） */
  async remove(id: number): Promise<void> {
    await this.client.delete('/postbot/media/client/remove', { id });
  }

  /** 批量删除客户端（引擎 /batch_remove，ids 为查询参数） */
  async batchRemove(ids: number[]): Promise<void> {
    await this.client.request('/postbot/media/client/batch_remove', {
      method: 'DELETE',
      params: { ids: ids.join(',') },
    });
  }
}
