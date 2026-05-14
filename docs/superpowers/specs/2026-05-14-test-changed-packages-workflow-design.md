# Test Changed Packages Workflow

**Date:** 2026-05-14
**Status:** Approved

## Goal

Run `test` and `build` only on packages affected by changes in a PR or push to main, using Turbo's built-in dependency graph resolution. No hard-coded paths.

## Approach

Use Turbo's `--filter="...[SHA]"` syntax to detect changed packages and their transitive dependents, then run `test` and `build` tasks only on those packages.

## Workflow

**File:** `.github/workflows/test-apps.yml`

**Triggers:**
- Push to `main`
- Pull request to `main`
- Manual dispatch

**Steps:**
1. Checkout with `fetch-depth: 0` (Turbo needs full history for diff)
2. Setup Node.js 20 with npm cache
3. `npm install --ignore-scripts`
4. Run `turbo run test build --filter="...[BASE]"` where BASE is `github.event.pull_request.base.sha` for PRs or `HEAD^` for pushes

## Key Decisions

- **Single job** — Turbo parallelizes internally across packages
- **`fetch-depth: 0`** — required for Turbo to compute the diff between commits
- **`--ignore-scripts`** on install — skips prepare/build scripts, matches existing CI pattern
- **Packages without `test` script** — Turbo skips them automatically
- **Transitive dependents** — if `packages/ui` changes, both `matriz-gui` and `filial-gui` are tested because they depend on it

## Coverage

All 13 workspaces are covered automatically:
- `apps/udp-iot/applications/*` (6 apps)
- `apps/udp-iot/packages/*` (3 packages)
- `apps/chat-udp`, `apps/file-storage`
- `tools/*`, `launcher`

New packages added to `package.json` workspaces are included with zero config changes.
