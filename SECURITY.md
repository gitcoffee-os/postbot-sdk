# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of PostBot SDK seriously. If you believe you have found
a security vulnerability, please report it privately.

**Please do not report security vulnerabilities through public GitHub issues.**

Use GitHub's private vulnerability reporting:

- [Report a vulnerability](https://github.com/gitcoffee-os/postbot-sdk/security/advisories/new)

You should receive a response within 48 hours. If for some reason you do not,
please follow up to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g. credential leakage, request forgery, injection)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Scope

The SDK handles credentials in memory and forwards them to the endpoint
configured by the caller. Reports about the following are especially welcome:

- Credential or token leakage through logs, errors or generated URLs
- Request construction flaws (URL joining, query encoding, header injection)
- Timeout or abort handling that leaves requests hanging
- Incorrect error classification that hides authentication failures

## Preferred Languages

We prefer all communications to be in English or Chinese.
