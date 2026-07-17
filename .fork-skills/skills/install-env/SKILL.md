---
name: install-env
description: >-
  Set up a npm environment and install
  obsidian-pivi-cross in editable mode from the
  current repo for local development.
  Use when the user asks to install obsidian-pivi-cross,
  set up a dev environment, create a virtualenv, or install a specific release.
---

# Install Environment

All installs are **editable** from the current repo checkout, so source
changes take effect immediately.

## Prerequisites

Verify the project's toolchain is on PATH before proceeding.

## Step 1: Create and activate the environment

Create the project's environment per its standard setup, then continue.

## Step 2: Install in editable mode

```bash
npm ci
```

## Step 3: Verify the install (mandatory)

Do not proceed to test runs with a half-installed environment. Run every check
below and fail loudly if any of them fail:

Run the project's own smoke check (import / `--version` / build) and confirm it
passes before moving on.

## Pitfalls

- Upstream changed tag convention at 0.3.0: old releases v0.1.0..v0.2.4 use a 'v' prefix and annotated tags; releases 0.3.x..0.5.0+ are bare numbers (e.g. 0.5.0) as lightweight/unannotated tags. detect-upstream-base MUST use 'git describe --tags --match "[0-9]*"' (--tags for lightweight, [0-9]* to match new releases). Tag must equal manifest.json version with NO leading 'v'.
- manifest.json version invariant: Git tag and GitHub release must equal manifest.json.version with NO leading 'v' (e.g. 0.5.0); verify after every rebase.
- main.js bundle is ~2.8MB; watch for size growth after Pi/provider dependency changes via `npm run analyze:bundle`.
- Jest invocation: AGENTS.md mandates running through `npm run test` (scripts/run-jest.js adds --localstorage-file). Use `npm run test -- {path}` for single files. Verified 2026-07-10: bare `npx jest` currently passes the full suite (149 suites / 1067 tests) since no test exercises localStorage, but the wrapper is the project-sanctioned, future-proof form and matches the `npm run test:coverage` verification gate.

## Notes

- Use the project's package manager (`npm`)
  and the project venv — never system Python/pip or bare global installs.
- If you rebase the dev branch, reinstall to keep compiled libraries in sync
  with the new base.
