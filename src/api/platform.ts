import { PostbotClient } from './client.js';
import type { PaginatedResult } from './task.js';

/** 引擎媒体平台实体 */
export interface Platform {
  id: number;
  name: string;
  code: string;
  type: string;
  icon?: string;
  favicon?: string;
  homepage?: string;
  url?: string;
  baseUrl?: string;
  description?: string;
  sort?: number;
  status?: string;
  config?: string;
  /** 发布端配置（JSON）：按 BROWSER_EXTENSION / DESKTOP / CLOUD 配置发布页与能力开关 */
  publishChannelConfig?: string;
}

export interface PlatformListParams {
  page?: number;
  size?: number;
}

export class PlatformApi {
  private client: PostbotClient;

  constructor(client: PostbotClient) {
    this.client = client;
  }

  /** 分页查询平台（引擎 /list） */
  async listPaged(params: PlatformListParams = {}): Promise<PaginatedResult<Platform>> {
    const response = await this.client.get<PaginatedResult<Platform>>('/postbot/media/platform/list', {
      page: String(params.page || 1),
      size: String(params.size || 20),
    });
    return response.data;
  }

  /** 查询全部平台（引擎 /listing，不分页） */
  async list(): Promise<Platform[]> {
    const response = await this.client.get<Platform[]>('/postbot/media/platform/listing');
    return response.data ?? [];
  }

  /** 加载单个平台（引擎 /load） */
  async get(id: number): Promise<Platform> {
    const response = await this.client.get<Platform>('/postbot/media/platform/load', { id: String(id) });
    return response.data;
  }

  /** 保存平台（引擎 /save） */
  async create(data: Partial<Platform>): Promise<void> {
    await this.client.post('/postbot/media/platform/save', data);
  }

  /** 更新平台（引擎 /update） */
  async update(id: number, data: Partial<Platform>): Promise<void> {
    await this.client.put('/postbot/media/platform/update', { id, ...data });
  }

  /** 删除平台（引擎 /remove） */
  async remove(id: number): Promise<void> {
    await this.client.delete('/postbot/media/platform/remove', { id });
  }

  /** 批量删除平台（引擎 /batch_remove，ids 为查询参数） */
  async batchRemove(ids: number[]): Promise<void> {
    await this.client.request('/postbot/media/platform/batch_remove', {
      method: 'DELETE',
      params: { ids: ids.join(',') },
    });
  }
}
