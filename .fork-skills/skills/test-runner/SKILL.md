---
name: test-runner
description: >-
  Run obsidian-pivi-cross tests locally in the current
  shell environment using the detected test framework and CI-equivalent
  commands. Use when the user asks to run tests locally, reproduce a CI
  failure, run a specific test file or test area, or match CI behavior.
---

# Local Test Runner

Run obsidian-pivi-cross's tests locally — either
a specific test file/command or a full CI test area — directly in the current
shell.

## Github Actions → Local Mapping

| github_actions concept | Local equivalent |
|---|---|
| workflow steps | the same command from the step, run in current env |
| CI working dir | <repo_root>/<test_dir> |
| matrix shards | run the whole suite locally |

CI config lives under `.github/workflows/` — read it to extract
the exact commands, working directory, and any `export` lines for a given area.

## Workflow

### 1) Ensure environment is set up

Check the project is installed in editable mode. If not, use the `install-env`
skill first — do **not** patch around a partial install.


### 2) Determine what to run

Two modes — pick based on user input:

**A) Specific test file or command** (user provides a path or command):
- Accept directly.
- Substitute the path into the test command pattern:
  `npm run test -- {path}`

**B) github_actions test area** (user names an area):
- Read `.github/workflows/` and extract the command list for
  the requested area.
- Strip CI-specific variables (shard ids, parallel-job counters) and replicate
  any `export` lines.

### 3) Run tests

```bash
mkdir -p .cache/test-logs
npm run test -- {path} \
  2>&1 | tee .cache/test-logs/<test-name>-$(date +%Y%m%d-%H%M%S).log
```


### 4) Store logs

Save test output under `.cache/test-logs/`. Log file naming:
`<test-name>-<YYYYMMDD-HHMMSS>.log`. After the run, report the log file path to
the user.

### 5) Silent-regression watchlist

When tests pass but behaviour looks off, suspect silent regressions from these
dependencies (a version bump can change semantics without a code change here):

- **obsidian (Obsidian plugin API surface; upstream bumps may break runtime APIs without surfacing as type errors)** — compare runtime signals (not just pass/fail) between the
  pre- and post-rebase runs before declaring victory.
- **@earendil-works/* pi-agent-core SDK (upstream may change tool/event/session contracts silently)** — compare runtime signals (not just pass/fail) between the
  pre- and post-rebase runs before declaring victory.

## Notes
- The editable install picks up source changes immediately; only native
  extension changes need a reinstall.
- For long-running tests, run as a background command and poll the log until the
  exit-code footer appears.
