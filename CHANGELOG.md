# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0](https://github.com/gitcoffee-os/postbot-sdk/compare/v1.0.0...v1.1.0) (2026-10-24)


### Features

* initial release of PostBot SDK v1.0.0 ([7ce7d9b](https://github.com/gitcoffee-os/postbot-sdk/commit/7ce7d9b6df5f4eac5c08bf69a88c518f9c328231))

## [1.0.0] - 2026-10-22

### Added

- `PostbotClient` with `App-Id` / Bearer authentication and configurable request timeout.
- API modules: `TaskApi`, `PlatformApi`, `AccountApi`, `ClientApi`,
  `WorkflowApi`, `AutoPublishApi`, `FingerprintApi`, `SessionApi`, `NotifyApi`.
- IAM helpers: `getAppToken`, `proxyLogin`, `proxyRegister`,
  `proxyForgotPassword`, `directLogin`, `getUserInfo`.
- Unified error handling through `IamApiError`, `isSuccessCode` and `toApiError`.
- TypeScript declarations, source maps and ESM entry point.
- Unit tests for the HTTP client, error mapping and IAM helpers.

### Security

- All IAM requests now honor a timeout (`DEFAULT_IAM_TIMEOUT_MS`, 30 seconds)
  and can be overridden per call with `timeoutMs`.
