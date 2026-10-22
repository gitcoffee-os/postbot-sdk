import { PostbotClient } from './client.js';

/** 媒体账号浏览器指纹 */
export interface MediaAccountFingerprint {
  id?: number;
  mediaAccountId: number;
  userType?: string;
  userId?: number;
  ua?: string;
  locale?: string;
  timezone?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  deviceScaleFactor?: number;
  hardwareConcurrency?: number;
  colorScheme?: 'light' | 'dark' | string;
  os?: string;
  platform?: string;
  /** 指纹业务版本，每次更新自动 +1 */
  version?: number;
  createTime?: string;
}

/**
 * 媒体账号指纹 API（用户端）。
 * 指纹用于保证同一账号下同平台发布/浏览的浏览器环境一致（UA/时区/视口等）。
 */
export class FingerprintApi {
  private client: PostbotClient;

  constructor(client: PostbotClient) {
    this.client = client;
  }

  /** 按账号加载指纹；返回 null 表示未设置，将使用引擎自动解析（四级降级） */
  async load(mediaAccountId: number): Promise<MediaAccountFingerprint | null> {
    const response = await this.client.get<MediaAccountFingerprint | null>(
      '/postbot/media/account/fingerprint/load',
      { mediaAccountId: String(mediaAccountId) },
    );
    return response.data ?? null;
  }

  /** 创建或更新账号指纹（更新时 version 自动 +1） */
  async save(fingerprint: MediaAccountFingerprint): Promise<void> {
    await this.client.post('/postbot/media/account/fingerprint/save', fingerprint);
  }

  /** 移除账号指纹，恢复为自动解析 */
  async remove(mediaAccountId: number): Promise<void> {
    await this.client.request('/postbot/media/account/fingerprint/remove', {
      method: 'DELETE',
      params: { mediaAccountId: String(mediaAccountId) },
    });
  }
}
