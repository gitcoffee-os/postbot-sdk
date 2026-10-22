import { PostbotClient } from './client.js';

export interface NotifyRequest {
  /** 事件名称，如 userProxyRenewal */
  event: string;
  /** 事件详情（任意 JSON 对象） */
  info?: unknown;
}

/**
 * 通用通知 API（用户端）。
 * 引擎会按 Client-Id 找到第三方回调配置并实时 POST 通知。
 */
export class NotifyApi {
  private client: PostbotClient;

  constructor(client: PostbotClient) {
    this.client = client;
  }

  async send(request: NotifyRequest, clientId?: string): Promise<void> {
    await this.client.request('/postbot/notify', {
      method: 'POST',
      body: request,
      headers: clientId ? { 'Client-Id': clientId } : undefined,
    });
  }
}
