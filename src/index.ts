export { PostbotClient } from './api/client.js';
export type { PostbotClientOptions, ApiResponse, RequestOptions } from './api/client.js';

export { IamApiError, isSuccessCode, toApiError } from './api/errors.js';

export {
  DEFAULT_IAM_TIMEOUT_MS,
  getAppToken,
  proxyLogin,
  proxyRegister,
  proxyForgotPassword,
  directLogin,
  getUserInfo,
} from './api/iam.js';
export type { ProxyLoginResult, AppTokenResult, UserInfo } from './api/iam.js';

export { TaskApi } from './api/task.js';
export type {
  Task,
  TaskDataInput,
  TaskSaveRequest,
  TaskListParams,
  PaginatedResult,
} from './api/task.js';

export { PlatformApi } from './api/platform.js';
export type { Platform, PlatformListParams } from './api/platform.js';

export { AccountApi } from './api/account.js';
export type { Account, AccountListParams, AccountSaveRequest } from './api/account.js';

export { ClientApi } from './api/media-client.js';
export type {
  MediaClient,
  MediaClientType,
  MediaClientSaveRequest,
} from './api/media-client.js';

export { WorkflowApi } from './api/workflow.js';
export type { WorkflowExecutionResult } from './api/workflow.js';

export { AutoPublishApi } from './api/autopublish.js';
export type {
  AutoPublishJob,
  AutoPublishLog,
  AutoPublishListParams,
  PublishStatusResult,
} from './api/autopublish.js';

export { FingerprintApi } from './api/fingerprint.js';
export type { MediaAccountFingerprint } from './api/fingerprint.js';

export { SessionApi } from './api/session.js';
export type { Session, SessionCookie, SessionStorage } from './api/session.js';

export { NotifyApi } from './api/notify.js';
export type { NotifyRequest } from './api/notify.js';
