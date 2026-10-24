# Releasing

Releases are fully automated:

```
push to main
  └─ release-please.yml
       ├─ opens / updates a release PR (version + CHANGELOG + package-lock)
       └─ when that PR is merged, creates the tag + GitHub Release
            └─ calls release.yml
                 └─ typecheck / test / build / pack smoke test
                      └─ npm publish --provenance --access public
```

The only manual step per release is **merging the release PR**.

## One-time setup

1. **npm organization** — create `gitcoffee` on npmjs.com (if missing) and make
   sure the releasing account is a member with publish rights.
2. **npm token** — create an **Automation** token, or a **Granular** token with
   **Read and write** access to **All packages** and **Bypass 2FA** enabled
   (a token scoped to a package that does not exist yet cannot create it).
   Add it to GitHub as the secret `NPM_TOKEN`
   (Settings → Secrets and variables → Actions → New repository secret).
3. **Allow release PRs** — in Settings → Actions → General → Workflow
   permissions, enable **Allow GitHub Actions to create and approve pull
   requests**. Without it release-please cannot open its release PR.
4. **Bootstrap 1.0.0** — the current version already exists in `package.json`
   and `CHANGELOG.md` but has never been published, so seed release-please with
   a 1.0.0 baseline tag:

   ```bash
   git add .github/workflows release-please-config.json .release-please-manifest.json RELEASING.md CONTRIBUTING.md
   git commit -m "ci: automate releases with release-please"
   git tag v1.0.0
   git push origin main --follow-tags
   ```

   Then run **Actions → Publish → Run workflow** once. It publishes
   `@gitcoffee/postbot-sdk@1.0.0` and creates the GitHub Release. Because the
   `v1.0.0` tag already exists at `main`, release-please treats 1.0.0 as the
   baseline and will not propose a spurious bump.

5. **Optional, recommended after the first publish** — configure
   **Trusted Publishing** on npmjs.com (package → Settings → Trusted Publisher →
   GitHub Actions, repository `gitcoffee-os/postbot-sdk`, workflow
   `release.yml`), then delete the `NPM_TOKEN` secret. Publishing then uses
   OIDC only; provenance is already enabled.

## Day-to-day releases

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Commit | Release |
| --- | --- |
| `fix: …` | patch (1.0.0 → 1.0.1) |
| `feat: …` | minor (1.0.0 → 1.1.0) |
| `feat!: …` or `BREAKING CHANGE:` footer | major (1.0.0 → 2.0.0) |
| `chore:` / `ci:` / `docs:` / `test:` | no release |

Then:

1. Push commits to `main`.
2. Review the release PR opened by release-please (version, `CHANGELOG.md`,
   `package.json`, `package-lock.json`).
3. Merge it. The tag, GitHub Release, and npm publish follow automatically.
4. Verify with `npm view @gitcoffee/postbot-sdk version`.

Never edit the version or `CHANGELOG.md` by hand; release-please owns both.

## Manual / break-glass publish

Run **Actions → Publish → Run workflow**. It publishes the version currently in
`package.json` if it is not already on npm, and creates the matching tag and
GitHub Release when missing. Re-running is safe: an already published version is
skipped.

## Notes

- `release.yml` is a reusable workflow (`workflow_call`) plus `workflow_dispatch`.
  It is not triggered by GitHub Release events: release-please creates releases
  with `GITHUB_TOKEN`, and GitHub does not start workflows from those events.
- The release PR is opened with `GITHUB_TOKEN`, so CI is **not** triggered on it.
  If branch protection requires status checks, either allow the release PR to
  bypass them or add a fine-grained PAT as `RELEASE_PLEASE_TOKEN` and pass
  `token: ${{ secrets.RELEASE_PLEASE_TOKEN }}` to the release-please step.
- Provenance requires a public repository and `id-token: write`, both already
  configured.
- If the npm account enforces 2FA, the CI token must have 2FA bypass enabled, or
  publishing fails with `EOTP`.
