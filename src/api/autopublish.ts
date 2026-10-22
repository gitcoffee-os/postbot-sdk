import { PostbotClient } from './client.js';

/** 自动发布调度任务 */
export interface AutoPublishJob {
  id: number;
  taskId: number;
  userType?: string;
  userId?: number;
  publishChannel?: string;
  platformCode?: string;
  mediaPlatformId?: number;
  mediaAccountId?: number;
  mediaClientId?: number;
  taskType?: string;
  priority?: number;
  scheduledAt?: string;
  executedAt?: string;
  /** PENDING / SCHEDULED / RUNNING / SUCCESS / FAILED_RETRYABLE / FAILED / CANCELLED */
  status: string;
  retryCount?: number;
  maxRetryCount?: number;
  workerNode?: string;
  claimedBy?: string;
  claimAt?: string;
  leaseExpiresAt?: string;
  taskSnapshot?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 自动发布执行日志 */
export interface AutoPublishLog {
  id: number;
  taskId: number;
  jobId?: number;
  userType?: string;
  userId?: number;
  publishChannel?: string;
  platformCode?: string;
  accountId?: number;
  clientId?: number;
  /** PENDING / RUNNING / SUCCESS / FAILED_RETRYABLE / FAILED / CANCELLED */
  status: string;
  publishedUrl?: string;
  contentUrl?: string;
  errorMsg?: string;
  fullLog?: string;
  screenshotUrl?: string;
  videoUrl?: string;
  failureReason?: string;
  startedAt?: string;
  finishedAt?: string;
  retryCount?: number;
  workerNode?: string;
  workerJobId?: string;
  sessionbotSessionId?: number;
  proxybotProfileId?: number;
  proxyHost?: string;
  proxyPort?: number;
  cookieCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AutoPublishListParams {
  taskId?: number;
  status?: string;
  platformCode?: string;
  /** 只保留最近 N 条 */
  limit?: number;
}

/**
 * 引擎 `/autopublish/task/{taskId}/status` 返回该任务**最新一条 Job 实体**（可能为 null）。
 * 任务级聚合状态请使用 `WorkflowApi.executeWorkflow('STATUS_QUERY', ...)` 或 `TaskApi.get()`。
 */
export type PublishStatusResult = AutoPublishJob;

export class AutoPublishApi {
  private client: PostbotClient;

  constructor(client: PostbotClient) {
    this.client = client;
  }

  /** 手动触发任务自动发布（忽略既定定时时间，立即编排 Job） */
  async trigger(taskId: number): Promise<void> {
    await this.client.post(`/postbot/autopublish/task/${taskId}/trigger`);
  }

  /** 查询任务最新 Job（无 Job 时返回 null） */
  async getStatus(taskId: number): Promise<AutoPublishJob | null> {
    const response = await this.client.get<AutoPublishJob | null>(`/postbot/autopublish/task/${taskId}/status`);
    return response.data ?? null;
  }

  /** 查询当前用户的调度 Job 列表（支持客户端过滤） */
  async listJobs(params: AutoPublishListParams = {}): Promise<AutoPublishJob[]> {
    const response = await this.client.get<AutoPublishJob[]>('/postbot/autopublish/job/list');
    const jobs = response.data ?? [];
    return filterAndLimit(jobs, params);
  }

  /** 查询当前用户的执行日志列表（支持客户端过滤） */
  async listLogs(params: AutoPublishListParams = {}): Promise<AutoPublishLog[]> {
    const response = await this.client.get<AutoPublishLog[]>('/postbot/autopublish/log/list');
    const logs = response.data ?? [];
    return filterAndLimit(logs, params);
  }
}

function filterAndLimit<T extends { taskId?: number; status?: string; platformCode?: string }>(
  items: T[],
  params: AutoPublishListParams,
): T[] {
  let result = items;
  if (params.taskId !== undefined) {
    result = result.filter((item) => String(item.taskId) === String(params.taskId));
  }
  if (params.status) {
    result = result.filter((item) => item.status === params.status);
  }
  if (params.platformCode) {
    result = result.filter((item) => item.platformCode === params.platformCode);
  }
  if (params.limit !== undefined && params.limit >= 0) {
    result = result.slice(0, params.limit);
  }
  return result;
}
