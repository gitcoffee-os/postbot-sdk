<p align="center">
  <img alt="logo" src="https://postbot.exmay.com/docs/images/postbot_logo.svg" width="150" height="150">
</p>
<h1 align="center" style="margin: 30px 0 30px; font-weight: bold;">PostBot SDK v1.0.0</h1>

<h4 align="center">
  面向多平台内容同步场景的 TypeScript SDK。
  <br />
  提供任务、平台、账号、客户端、发布调度、工作流与认证的统一 API 封装，无缝对接 PostBot / Postar 引擎。
</h4>
<p align="center">
  <a href="https://github.com/gitcoffee-os/postbot-sdk/blob/main/LICENSE" style="display:inline-block;margin:5px;">
    <img src="https://img.shields.io/github/license/gitcoffee-os/postbot-sdk.svg" alt="License">
  </a>
  <a href="https://www.npmjs.com/package/@gitcoffee-os/postbot-sdk" style="display:inline-block;margin:5px;">
    <img src="https://img.shields.io/npm/v/@gitcoffee-os/postbot-sdk.svg" alt="npm version">
  </a>
</p>

<p align="center">
	正在持续迭代中...
</p>

<p align="center">
   <a href="https://github.com/gitcoffee-os/magio" target="_blank" style="font-size:14px;color:#915930;">基于开源生态内的开源项目 Magio 平台开发（内置免费模型）<br />Magio 面向全应用端的全链路 AI 开发平台与全场景智能体工作空间</a>
</p>

> [!NOTE]
> 本 SDK 面向开发者与自动化场景，只包含 API 客户端与类型定义，不包含浏览器扩展或桌面端运行时。<br />
> 如需开箱即用的产品，请访问 [PostBot 内容同步助手](https://postbot.exmay.com)。

## 特性

- **零运行时依赖**：仅使用 Node.js 内置的 `fetch`、`AbortController` 与标准 Web API。
- **统一客户端**：`App-Id`、Bearer Token、超时、错误归一化一次配置。
- **完整 API 模块**：任务、平台、账号、客户端、发布调度、工作流、会话、通知、浏览器指纹。
- **认证助手**：开发者应用凭证、代理登录/注册/重置密码、直接登录、当前用户信息。
- **类型安全**：完整 TypeScript 声明、严格模式、ESM 入口与 source map。
- **可预期错误**：业务失败统一抛出 `IamApiError`，携带 `code` 与 HTTP `status`。
- **脚本友好**：可在 CLI、服务端批处理、CI/CD 与工作流引擎中直接调用。

## 安装

```bash
# npm
npm install @gitcoffee-os/postbot-sdk

# pnpm
pnpm add @gitcoffee-os/postbot-sdk
```

要求 Node.js >= 18，包为纯 ESM。

## 快速开始

```ts
import { PostbotClient, TaskApi } from '@gitcoffee-os/postbot-sdk';

const client = new PostbotClient({
  baseUrl: 'https://your-postbot-host', // 你的 PostBot 服务地址
  appId: 'your-app-id',
  token: 'user-access-token',
});

const tasks = new TaskApi(client);

// 分页查询任务
const page = await tasks.list({ page: 1, size: 20, status: 'FAILED' });
console.log(page.total, page.list);

// 创建并自动发布任务
const task = await tasks.create({
  name: '多平台文章',
  platformCodes: ['weixin', 'xiaohongshu'],
  data: {
    title: 'Hello PostBot',
    content: '<h2>Hello</h2><p>来自 SDK 的正文。</p>',
  },
  isAutoPublish: true,
});
console.log(task.id);
```

## 客户端配置

```ts
const client = new PostbotClient({
  baseUrl: 'https://your-postbot-host',
  appId: 'your-app-id',
  token: 'optional-token',
  timeoutMs: 30_000, // 单次请求超时，默认 30000
});

client.setToken('new-token'); // 登录后更新 Token
```

| 选项 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `baseUrl` | `string` | 是 | 引擎 API 根地址，末尾斜杠可有可无 |
| `appId` | `string` | 是 | 应用标识，写入 `App-Id` 请求头 |
| `token` | `string` | 否 | 用户 Token，写入 `Authorization: Bearer <token>` |
| `timeoutMs` | `number` | 否 | 单次请求超时，默认 `30000` 毫秒 |

## 认证

### 获取用户 Token

```ts
import { PostbotClient, directLogin } from '@gitcoffee-os/postbot-sdk';

const { access_token, expires_in } = await directLogin(baseUrl, username, password);

const client = new PostbotClient({ baseUrl, appId, token: access_token });
```

### 开发者应用代理登录

```ts
import {
  getAppToken,
  proxyLogin,
  proxyRegister,
  proxyForgotPassword,
} from '@gitcoffee-os/postbot-sdk';

const appAccessToken = await getAppToken(iamBaseUrl, clientId, clientSecret);

const result = await proxyLogin({
  iamBaseUrl,
  appAccessToken,
  clientId,
  username,
  password,
  appId,
});

client.setToken(result.token);
```

`proxyRegister` 用于注册，`proxyForgotPassword` 用于重置密码。所有 IAM 请求均支持可选的
`timeoutMs` 参数（对象参数中传入），默认 30 秒。

### 当前用户

```ts
import { getUserInfo } from '@gitcoffee-os/postbot-sdk';

const user = await getUserInfo(iamBaseUrl, token, appId);
console.log(user.preferred_username ?? user.username);
```

## API 模块

| 模块 | 主要方法 | 说明 |
|---|---|---|
| `TaskApi` | `list` `listAll` `get` `create` `update` `delete` `batchDelete` `bindContent` | 任务 CRUD、批量删除、内容绑定 |
| `PlatformApi` | `listPaged` `list` `get` `create` `update` `remove` `batchRemove` | 平台字典 |
| `AccountApi` | `listPaged` `list` `get` `findBySession` `save` `update` `remove` `batchRemove` | 媒体账号 |
| `ClientApi` | `listPaged` `list` `get` `register` `update` `remove` `batchRemove` | 扩展 / 桌面 / 云端客户端 |
| `WorkflowApi` | `executeWorkflow` `getExecutionStatus` `retryExecution` `listDefinitions` | 工作流编排 |
| `AutoPublishApi` | `trigger` `getStatus` `listJobs` `listLogs` | 自动发布调度与日志 |
| `FingerprintApi` | `load` `save` `remove` | 账号浏览器指纹 |
| `SessionApi` | `listPaged` `list` `get` | SessionBot 会话（只读） |
| `NotifyApi` | `send` | 通用通知 |
| IAM helpers | `getAppToken` `proxyLogin` `proxyRegister` `proxyForgotPassword` `directLogin` `getUserInfo` | 认证与用户信息 |

### 任务

```ts
import { TaskApi } from '@gitcoffee-os/postbot-sdk';

const tasks = new TaskApi(client);

await tasks.listAll();
await tasks.get(123);
await tasks.update(123, { name: '新标题' });
await tasks.bindContent(123, 'upstream-content-id');
await tasks.delete(123);
await tasks.batchDelete([123, 124]);
```

### 发布调度

```ts
import { AutoPublishApi } from '@gitcoffee-os/postbot-sdk';

const autoPublish = new AutoPublishApi(client);

await autoPublish.trigger(123); // 忽略定时时间，立即编排 Job
const job = await autoPublish.getStatus(123);
const jobs = await autoPublish.listJobs({ taskId: 123, status: 'FAILED', limit: 20 });
const logs = await autoPublish.listLogs({ taskId: 123, limit: 20 });
```

### 工作流

```ts
import { WorkflowApi } from '@gitcoffee-os/postbot-sdk';

const workflow = new WorkflowApi(client);

const execution = await workflow.executeWorkflow('STATUS_QUERY', { taskId: 123 });
const status = await workflow.getExecutionStatus(execution.executionId);
await workflow.retryExecution(execution.executionId);
const definitions = await workflow.listDefinitions();
```

### 账号与指纹

```ts
import { AccountApi, FingerprintApi } from '@gitcoffee-os/postbot-sdk';

const accounts = new AccountApi(client);
const account = await accounts.get(9);

const fingerprints = new FingerprintApi(client);
const fingerprint = await fingerprints.load(account.id);

await fingerprints.save({
  mediaAccountId: account.id,
  ua: 'Mozilla/5.0 ...',
  locale: 'zh-CN',
  timezone: 'Asia/Shanghai',
  viewportWidth: 1440,
  viewportHeight: 900,
});

await fingerprints.remove(account.id);
```

### 通知

```ts
import { NotifyApi } from '@gitcoffee-os/postbot-sdk';

await new NotifyApi(client).send(
  { event: 'userProxyRenewal', info: { userId: 1 } },
  'optional-client-id',
);
```

## 错误处理

后端可能以 HTTP 200 + 业务码返回失败，SDK 会统一转换为 `IamApiError`：

```ts
import { IamApiError } from '@gitcoffee-os/postbot-sdk';

try {
  await tasks.get(123);
} catch (err) {
  if (err instanceof IamApiError) {
    console.error(err.code);   // 如 USER.TOKEN_EXPIRED、NOT_LOGIN
    console.error(err.status); // HTTP 状态码
    console.error(err.message);
  } else {
    throw err;
  }
}
```

自定义传输层可复用底层工具：

```ts
import { isSuccessCode, toApiError } from '@gitcoffee-os/postbot-sdk';

if (!isSuccessCode(body.code)) {
  throw toApiError(body, status);
}
```

## 超时与安全

- `PostbotClient` 的每个请求都会在 `timeoutMs` 后中止；IAM 助手默认 `DEFAULT_IAM_TIMEOUT_MS`（30 秒），可按调用覆盖。
- 生产环境必须使用 HTTPS；SDK 不会替调用方校验证书或协议。
- `clientSecret`、用户密码和 Token 由调用方保管；不要把 `clientSecret` 放进浏览器或前端产物。
- SDK 不持久化任何凭据，也不发送遥测数据。

## 运行时与兼容性

- 运行时：Node.js >= 18（依赖全局 `fetch`、`AbortController`）。
- 开发与测试：Node.js >= 20（Vitest 4 要求）。
- 纯 ESM，使用 `import` 引入；类型声明随包发布。
- `getAppToken` 使用 Node.js `Buffer` 生成 Basic Auth，仅适用于 Node.js 环境；其余客户端逻辑不依赖 Node 专有 API。
- 版本遵循 [Semantic Versioning](https://semver.org/)；变更记录见 [CHANGELOG.md](CHANGELOG.md)。

## 开发

```bash
git clone https://github.com/gitcoffee-os/postbot-sdk.git
cd postbot-sdk

npm ci
npm run typecheck
npm test
npm run build
```

修改 `src` 后需要重新构建 `dist`，依赖方才能读取到新的类型与实现。

## 文档

- [官网文档](https://postbot.exmay.com/docs)
- [API 文档](https://postbot.exmay.com/docs/api)
- [开发指南](https://postbot.exmay.com/docs/dev-guide)
- [Engine API 对接说明](https://github.com/gitcoffee-os/gitcoffee-os/blob/main/apps/postbot-cli/docs/ENGINE-API.md)

## 👀 使用体验
- [PostBot 内容同步助手 云端体验](https://postbot.exmay.com/exmay/postbot/center/home)

## 📚 技术文档
- [官网文档](https://postbot.exmay.com/docs)
- [用户指南](https://postbot.exmay.com/docs/README)
- [快速开始](https://postbot.exmay.com/docs/quickstart)
- [开发指南](https://postbot.exmay.com/docs/dev-guide)

## 💻 代码托管

### PostBot SDK
- GitHub：[https://github.com/gitcoffee-os/postbot-sdk](https://github.com/gitcoffee-os/postbot-sdk)
- Gitee：[https://gitee.com/gitcoffee-os/postbot-sdk](https://gitee.com/gitcoffee-os/postbot-sdk)

### PostBot
- GitHub：[https://github.com/gitcoffee-os/postbot](https://github.com/gitcoffee-os/postbot)
- Gitee：[https://gitee.com/gitcoffee-os/postbot](https://gitee.com/gitcoffee-os/postbot)

### 国际版 Postar
- GitHub：[https://github.com/gitcoffee-os/postar](https://github.com/gitcoffee-os/postar)
- Gitee：[https://gitee.com/gitcoffee-os/postar](https://gitee.com/gitcoffee-os/postar)

## 🙌 贡献指南

PostBot SDK 只有通过开源协作才能蓬勃发展。秉持这一精神，我们欢迎来自社区的各种贡献。如果您有意参与其中，请查阅我们的 [贡献者指南](CONTRIBUTING.md) 与 [行为准则](CODE_OF_CONDUCT.md)。

## ⚖️ License

本项目遵循 [GitCoffee Open Source License](LICENSE) 开源协议，该许可证本质上是 [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0)，但有一些额外的限制。

## 🤝 商务合作

- [合作咨询](https://postbot.exmay.com/docs/partner)

## 👥 加入社区

PostBot 内容同步助手 微信 交流群：

<img src="https://cdn.exmay.com/exmay/upload/app/qrcode/gitcoffee/gitcoffee-wechat-qrcode.png" width="230px" title="PostBot 内容同步助手 微信群" />

(扫码添加微信，备注：PostBot SDK，邀您加入群聊)

- [用户社群](https://postbot.exmay.com/docs/usergroup)

## 🌐 国际版
- [Postar - 国际版内容同步助手](https://postar.exmay.com/docs/) — 面向国际媒体平台（X / Twitter、Facebook、Instagram、TikTok、YouTube、LinkedIn 等）的内容同步分发工具。
- GitHub：[https://github.com/gitcoffee-os/postar](https://github.com/gitcoffee-os/postar)

## 🌍 开源生态

[开源生态](https://postbot.exmay.com/docs/opensource)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/image?repos=gitcoffee-os/postbot&type=date&legend=top-left)](https://github.com/gitcoffee-os/postbot)

<div align="center">

**⚡ PostBot 内容同步助手** - 一款开源的多平台内容同步分发生产力工具。

支持将文章、笔记、动态、图片、视频、音频等内容，一键同步发布至主流媒体平台。 🚀

[🏠 官网](https://postbot.exmay.com) | [📖 文档](https://postbot.exmay.com/docs) | [✨ PostBot 内容同步助手 云端体验](https://postbot.exmay.com/exmay/postbot/center/home) | [💬 社区](https://postbot.exmay.com/docs/usergroup) | [🐛 反馈](https://github.com/gitcoffee-os/postbot-sdk/issues) | [🌐 国际版 Postar](https://github.com/gitcoffee-os/postar)

</div>

<div align="center">

**⚡ PostBot SDK** - 面向多平台内容同步场景的 TypeScript SDK。 🚀

</div>
