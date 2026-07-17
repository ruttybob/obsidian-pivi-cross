---
name: cherry-pick-assistant
description: >-
  Cherry-pick custom fork commits onto a new upstream
  shuuul/obsidian-pivi tag, with conflict
  resolution and post-sync verification via user-specified checks. Use when
  the fork has diverged structurally (renames, moved files) so a full
  `git rebase --onto` can't follow, when the user asks to cherry-pick onto a
  new upstream tag, or when adopting upstream changes selectively per commit.
---

# Cherry-Pick Assistant

Cherry-pick this repository's custom fork commits onto a newer upstream
shuuul/obsidian-pivi tag in a safe, repeatable
way. Unlike rebase, cherry-pick replays commits one at a time and lets you
**skip** individual commits — the right choice when the fork has diverged
structurally or you want to carry only some custom commits forward.

**Notation** used throughout this document:
- **v1** — the upstream tag the branch is currently based on
- **v2** — the target upstream tag to sync onto
- **b1** — the branch before syncing (custom commits on top of v1)
- **b2** — the branch after syncing (custom commits replayed onto v2)

## Step 1: Collect Inputs

Gather the following from the user before proceeding.

### Auto-detected or user-provided

1. **Current base tag (v1)**: Either provided directly by the user, or
   auto-detected via the `detect-upstream-base` skill. See
   [detect-upstream-base](../detect-upstream-base/SKILL.md).
   If the user supplies v1 explicitly, skip detection and validate:
   ```bash
   git rev-parse "$V1" 2>/dev/null || echo "ERROR: tag $V1 not found"
   ```

### Required

2. **Target upstream tag (v2)**: The upstream tag to sync onto. Validate:
   ```bash
   git rev-parse "$V2" 2>/dev/null || echo "ERROR: tag $V2 not found"
   ```

3. **Verification checks**: One or more commands to run after syncing to confirm
   correctness. Store these verbatim — they are run as-is during verification.
   Defaults for this repo:

   - `npm run typecheck`
   - `npm run lint`
   - `npm run check:boundaries`
   - `npm run test:coverage`
   - `npm run build`

### Optional

4. **Reference commit**: A known-good commit where the checks pass, used to diff
   against when debugging failures. If not provided, `HEAD` on **b1** is used.

## Step 2: Analyze b1

Understand the custom commits on **b1** that sit on top of v1. The merge-base
between HEAD and `$V1` is the fork point (`FORK_POINT`), used throughout the
remaining steps.

```bash
FORK_POINT=$(git merge-base HEAD "$V1")
git log --oneline "$FORK_POINT"..HEAD
COMMIT_COUNT=$(git rev-list --count "$FORK_POINT"..HEAD)
git diff --stat "$FORK_POINT"..HEAD
```

Present summary to user:
- Number of custom commits
- Files modified/added/deleted
- Overall diff summary (what the fork changes at a high level)

## Step 3: Verify checks pass on b1 (gate)

**Do not skip this step.** Before any sync work, run every verification check
from Step 1.3 to confirm they pass on the reference state. Use the `test-runner`
skill for execution. See [test-runner](../test-runner/SKILL.md).

If any check fails, **stop** and ask the user to fix the issue, provide a
different reference commit where the checks pass, or proceed anyway and fix on
b2. Only proceed to Step 4 once all checks pass (or the user opts to skip).

## Step 4: Backup, Branch, and Prepare

Create safety nets, then prepare **b2**. **b1** is never modified.

1. Back up **b1**:
   ```bash
   B1=$(git rev-parse --abbrev-ref HEAD)
   git branch "backup-$B1-$(date +%Y%m%d-%H%M%S)"
   ```

2. Create **b2** starting at v2 (not b1) — custom commits will be replayed onto
   it one at a time:
   ```bash
   git checkout -b "$B1-$V2" "$V2"
   ```

   Do not squash: cherry-pick replays individual commits so each can be
   resolved or skipped on its own.

## Step 5: Cherry-pick b1's commits onto v2

Replay the custom commits from **b1** onto **b2** (which starts at v2).

1. Decide what to replay. Present the commit list from Step 2 to the user and
   confirm the set to cherry-pick. Default: all custom commits
   (`"$FORK_POINT"..HEAD`), oldest first. Offer to drop commits that no longer
   apply or that the fork no longer wants — skipping is the whole point of this
   strategy.

2. Cherry-pick the chosen commits:
   ```bash
   # all custom commits, oldest first:
   git cherry-pick "$FORK_POINT"..HEAD
   # or a specific subset, oldest first:
   git cherry-pick <sha1> <sha2> ...
   ```

3. If a conflict arises on a commit, resolve it one at a time:
   - Show conflicted files: `git status`
   - For each conflict:
     - Read the conflict markers
     - Compare what changed upstream:
       `git diff "$V1".."$V2" -- <file>`
     - Preserve custom intent while integrating upstream changes
     - If a reference commit was provided, compare
       `git show <reference-commit>:<file>` for guidance
   - Stage resolved file: `git add <file>`
   - Continue: `git cherry-pick --continue`
   - To drop a commit that no longer applies, skip it:
     `git cherry-pick --skip` (confirm with the user first — skipping loses
     that custom change)

4. If uncertain about a resolution, **stop and ask the user**.

### Conflict hotspots

This fork is a fully-rebranded soft fork of `shuuul/obsidian-pivi`: upstream
uses `pivi`/`Pivi`/`@pivi/*` everywhere, this fork uses `yapi`/`Yapi`/`@yapi/*`.
A raw `git rebase --onto` cannot follow the renames, so cherry-pick is the only
tractable sync strategy. The canonical hotspot list lives in
`.fork-skills/profile.json` (`fork_shape.conflict_hotspots`); the canonical
path/identifier translation lives in `scripts/rename-map.json`. The highest-risk
areas on every sync:

- `packages/yapi-agent-core/` — renamed directory (upstream `packages/pivi-agent-core/`)
- `@yapi/*` package scopes vs upstream `@pivi/*` — `package.json`, `tsconfig.json`,
  `jest.config.js`, `eslint.config.mjs`, and imports across `src/`/`packages/`/`tests/`
- `.yapi-` CSS namespace vs upstream `.pivi-` (`src/styles/**`)
- `.yapi/` vault data dir + `YAPI_*` constants vs upstream `.pivi/` + `PIVI_*`
- renamed identifiers: `YapiView`, `YapiSettings`, `yapiSettingsCodec`,
  `yapiSettingsStorage`, `yapiToolDisplay` vs upstream `Pivi*`/`pivi*`
- `manifest.json` (id `yapi`, author `se.kostrov`) and `package.json` (name `yapi`,
  author `Yadro`, version `0.1.0-u0.7.0`)
- fork-only docs/tooling: `LICENSE`, `README.md`, `CONTEXT.md`,
  `docs/adr/0001-rebrand-pivi-to-yapi-as-soft-fork.md`, `CHANGELOG.md`,
  `scripts/rename-map.json`, `scripts/apply-rename.mjs`, `scripts/check-rename.mjs`,
  `.fork-skills/**`

The Pi engine layer (`engine/pi`, `@earendil-works/pi-*`) is shared with upstream
and must NOT be renamed — only the host product is `yapi`.

### Conflict Resolution Rules

- Understand both sides before editing.
- Preserve custom branch intent — that's the whole point of the fork.
- Integrate upstream improvements that don't break custom behavior.
- If upstream deleted a file the fork doesn't modify, keep it deleted.
- Document non-obvious resolution decisions.

### Rename-map translation (pivi → yapi)

<!-- yapi-manual-edit: rename-map translation guidance. Reconcile on builder --update. -->

This fork is fully rebranded: upstream code uses `pivi`/`Pivi`/`PIVI` and
`@pivi/*`; this fork uses `yapi`/`Yapi`/`YAPI` and `@yapi/*`. Every upstream
commit you bring in must be translated to fork names **before** it will apply
cleanly. The single source of truth is `scripts/rename-map.json` (token rules,
structural renames, the display/code wordmark split, and the allowlist of
attribution that must survive — e.g. `shuuul/obsidian-pivi`).

Before applying an upstream commit (or while resolving its conflicts):

1. **Consult `scripts/rename-map.json`.** It records the mechanical rules and
   the explicit path/identifier renames.
2. **Translate tokens** in the upstream patch:
   - `pivi` → `yapi`, `Pivi` → `Yapi`, `PIVI` → `YAPI` (full 4-char,
     case-sensitive tokens).
   - `@pivi/` → `@yapi/` (package scopes); `packages/pivi-agent-core/` →
     `packages/yapi-agent-core/`; `.pivi-` → `.yapi-` (CSS); `.pivi/` → `.yapi/`
     (vault data dir); `PIVI_*` → `YAPI_*` (constants).
3. **Preserve the Pi engine layer.** The 2-char tokens `pi`/`Pi` (`PiAgent`,
   `engine/pi`, `@earendil-works/pi-agent-core`, `@earendil-works/pi-ai`,
   `@earendil-works/pi-coding-agent`) are shared with upstream and must NOT be
   renamed — only the host product is `yapi`. The 4-char rule never matches them.
4. **Apply the wordmark split intuitively.** Code identifiers use `Yapi*`
   (e.g. `YapiView`, `YapiSettings`); display surfaces use the **YaPi** wordmark
   (i18n string values, README/AGENTS prose, manifest `name`/`description`,
   package `description`). See `apply-rename.mjs` Pass 2 for the exact surfaces.
5. **Keep attribution.** `shuuul/obsidian-pivi` (upstream repo) and
   `obsidian-pivi-cross` (fork repo) survive the rename — they are allowlisted
   in the map and must not be "fixed" to `yapi`.
6. **Re-run the rename gate.** After applying translated commits, run
   `npm run check:rename` to prove no stray `pivi`/`Pivi`/`PIVI` tokens leaked
   in from upstream.

`scripts/apply-rename.mjs` is idempotent and re-runnable: if a future automated
patch-translator is added, it can apply Pass 1 + Pass 2 directly. Until then,
translation is manual, guided by the map.

## Step 6: Verify b2

Run the checks collected in Step 1 on **b2** to confirm the sync is correct.

1. Confirm branch shape:
   ```bash
   git log --oneline "$V2"..HEAD
   ```
   Expect: custom commit(s) on top of `$V2`.

2. Run verification checks using the `test-runner` skill. See
   [test-runner](../test-runner/SKILL.md).

3. If a check fails, debug and iterate:

   **a) Create a findings file** and update it as you investigate:
   ```bash
   mkdir -p .cache/investigation
   ```
   This avoids re-treading ground across multiple fix attempts.

   **b) Compare v1 vs v2** to find relevant upstream changes:
   ```bash
   git diff "$V1".."$V2" -- <failing-file-or-dir>
   git log --oneline "$V1".."$V2" -- <failing-file-or-dir>
   ```
   If the diff is large, inspect individual commits from the log to narrow down
   which upstream change introduced the breakage.


   **d) Check if v2 has related test cases** that test the same area:
   ```bash
   git diff "$V1".."$V2" -- tests/
   ```

   **e) Compare against the reference state** (Step 1.4 / Step 3):
   ```bash
   git diff <reference-commit> -- <failing-file>
   ```

   **f) Fix, amend, re-run**:
   ```bash
   git add -A && git commit --amend --no-edit
   ```
   Re-run the failing check via test-runner. Repeat until the check passes or
   escalate to the user.

4. Once all checks pass, provide summary:
   - Custom commits replayed
   - Conflicts resolved (list files and decisions)
   - Check results (pass/fail for each, with log file paths)
   - Any follow-up items needing manual review

## Step 7: Cleanup

After user confirms **b2** is satisfactory:

1. Report the backup branch name (snapshot of **b1**) for reference.
2. Note **b1** can be deleted if no longer needed.
3. If the user wants to push **b2**:
   ```bash
   git push origin HEAD
   ```

## Command Reference

```bash
# Analyze b1
FORK_POINT=$(git merge-base HEAD "$V1")
git log --oneline "$FORK_POINT"..HEAD

# Backup b1, create b2 at v2
B1=$(git rev-parse --abbrev-ref HEAD)
git branch "backup-$B1-<timestamp>"
git checkout -b "$B1-$V2" "$V2"

# Cherry-pick custom commits onto b2
git cherry-pick "$FORK_POINT"..HEAD        # all, oldest first
git cherry-pick <sha1> <sha2> ...          # selective subset

# Conflict resolution loop
git status
git diff "$V1".."$V2" -- <file>
git add <resolved-file>
git cherry-pick --continue
git cherry-pick --skip                     # drop a conflicting commit
git cherry-pick --abort                    # return to pre-cherry-pick state
```
