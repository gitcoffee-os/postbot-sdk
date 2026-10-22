import { PostbotClient } from './client.js';

/** 任务内容数据：兼容 JSON 对象 / JSON 字符串（引擎统一归一化为 JSON 字符串落库） */
export type TaskDataInput = string | Record<string, unknown> | unknown[];

/** 引擎任务实体 */
export interface Task {
  id: number;
  name: string;
  type: string;
  mediaPlatformId?: number;
  mediaAccountId?: number;
  mediaClientId?: number;
  contentId?: string;
  /** 目标平台编码列表（JSON 数组字符串，如 ["weixin","xiaohongshu"]） */
  platformCodes?: string;
  /** 任务内容数据（JSON 字符串） */
  data: string;
  isAutoPublish: boolean;
  config?: string;
  publishChannel: string;
  scheduledAt?: string;
  retryCount?: number;
  maxRetryCount?: number;
  lastExecutedAt?: string;
  publishedUrl?: string;
  contentUrl?: string;
  executionResult?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 任务保存/更新请求。
 * 字段与引擎 `ExmayPostbotMediaTaskSaveRequest` 对齐：
 * - `data` 支持 JSON 对象或字符串；
 * - `platformCodes`（顶层）会与 `data.platformCodes` 合并去重并做别名归一化；
 * - `scheduledAt` 缺省时由引擎解析 `data.onlineTime`；
 * - `status` 一般无需传，由引擎按 `isAutoPublish` + 定时时间推导。
 */
export interface TaskSaveRequest {
  id?: number;
  name?: string;
  type?: string;
  mediaPlatformId?: number | null;
  mediaAccountId?: number | null;
  mediaClientId?: number | null;
  contentId?: string;
  data?: TaskDataInput;
  platformCodes?: string[];
  isAutoPublish?: boolean;
  config?: string | Record<string, unknown>;
  publishChannel?: string;
  scheduledAt?: string;
  maxRetryCount?: number;
  status?: string;
}

export interface TaskListParams {
  page?: number;
  size?: number;
  status?: string;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  current: number;
  size: number;
  pages: number;
}

export class TaskApi {
  private client: PostbotClient;

  constructor(client: PostbotClient) {
    this.client = client;
  }

  /** 分页查询任务（引擎 /list） */
  async list(params: TaskListParams = {}): Promise<PaginatedResult<Task>> {
    const response = await this.client.get<PaginatedResult<Task>>('/postbot/media/task/list', {
      page: String(params.page || 1),
      size: String(params.size || 20),
      ...(params.status ? { status: params.status } : {}),
    });
    return response.data;
  }

  /** 查询全部任务（引擎 /listing，不分页） */
  async listAll(): Promise<Task[]> {
    const response = await this.client.get<Task[]>('/postbot/media/task/listing');
    return response.data ?? [];
  }

  /** 加载单个任务（引擎 /load，校验任务归属） */
  async get(id: number): Promise<Task> {
    const response = await this.client.get<Task>('/postbot/media/task/load', { id: String(id) });
    return response.data;
  }

  /** 新建任务（引擎 /save；isAutoPublish=true 时保存后自动编排发布 Job） */
  async create(data: TaskSaveRequest): Promise<Task> {
    const response = await this.client.post<Task>('/postbot/media/task/save', data);
    return response.data;
  }

  /** 更新任务（引擎 /update，需包含 id，自动校验归属） */
  async update(id: number, data: TaskSaveRequest): Promise<Task> {
    const response = await this.client.put<Task>('/postbot/media/task/update', { id, ...data });
    return response.data;
  }

  /** 删除任务（引擎 /remove） */
  async delete(id: number): Promise<void> {
    await this.client.delete('/postbot/media/task/remove', { id });
  }

  /** 批量删除任务（引擎 /batch_remove，ids 为查询参数） */
  async batchDelete(ids: number[]): Promise<void> {
    await this.client.request('/postbot/media/task/batch_remove', {
      method: 'DELETE',
      params: { ids: ids.join(',') },
    });
  }

  /**
   * 幂等绑定内容 ID（引擎 /bind_content）。
   * task.contentId 已非空时返回既有值，不覆盖。
   */
  async bindContent(taskId: number, contentId: string): Promise<string | null> {
    const response = await this.client.post<string | null>('/postbot/media/task/bind_content', {
      taskId,
      contentId,
    });
    return response.data;
  }
}
