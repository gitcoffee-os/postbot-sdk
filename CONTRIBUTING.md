# Contributing to PostBot SDK

感谢您对 PostBot SDK 的关注！我们欢迎任何形式的贡献，包括但不限于：

- 报告 Bug
- 提交功能建议
- 改进文档
- 提交代码修复或新功能

## 开发流程

### 环境要求

- 运行时：Node.js >= 18
- 开发与测试：Node.js >= 20（Vitest 4 要求）
- npm >= 9（或使用 pnpm / yarn）

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/gitcoffee-os/postbot-sdk.git
cd postbot-sdk

# 安装依赖
npm ci

# 类型检查
npm run typecheck

# 单元测试
npm test

# 构建
npm run build
```

### 项目结构

```
postbot-sdk/
  ├── src/
  │   ├── index.ts          公开导出
  │   └── api/
  │       ├── client.ts     HTTP 客户端、超时、请求头
  │       ├── errors.ts     错误码归一化
  │       ├── iam.ts        认证与用户信息
  │       ├── task.ts       任务
  │       ├── platform.ts   平台
  │       ├── account.ts    账号
  │       ├── media-client.ts
  │       ├── workflow.ts
  │       ├── autopublish.ts
  │       ├── fingerprint.ts
  │       ├── session.ts
  │       └── notify.ts
  ├── tests/                Vitest 测试
  └── dist/                 构建产物（不提交）
```

### 代码规范

- 使用 TypeScript，严格模式，禁止引入不必要的运行时依赖。
- 新增 API 方法时同步补充类型、JSDoc 与测试。
- 保持公开导出集中在 `src/index.ts`。
- 不要在源码中添加密钥、真实用户数据或个人/内部标识信息。
- 错误处理统一使用 `IamApiError` / `toApiError`。
- 所有网络请求必须支持超时，不得留下无法中止的 `fetch`。

### 测试

- 测试框架为 Vitest，文件位于 `tests/**/*.test.ts`。
- 网络请求通过 mock 全局 `fetch`，测试不得访问真实服务。
- 修复 Bug 时请附带能复现问题的测试。
- 提交前至少运行：

```bash
npm run typecheck && npm test && npm run build
```

### 提交 Pull Request

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feat/amazing-feature`)
3. 提交代码 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feat/amazing-feature`)
5. 创建 Pull Request

### 提交信息格式

参考 [Conventional Commits](https://www.conventionalcommits.org/)：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档变更
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具链变更

## 报告 Bug

请通过 [GitHub Issues](https://github.com/gitcoffee-os/postbot-sdk/issues) 提交，并包含：

- 运行环境（操作系统、Node.js 版本、包版本）
- 复现步骤
- 期望行为与实际行为
- 相关日志或最小复现代码

安全问题请勿公开提交，参见 [SECURITY.md](SECURITY.md)。

## 许可

贡献的代码将遵循项目的 [GitCoffee Open Source License](LICENSE)（Apache-2.0 附加条款）。
