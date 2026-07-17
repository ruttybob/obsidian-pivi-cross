# Skills Overview

Quick reference for how the skills in this directory relate to each other.
**Check this file before editing a skill** — changes may need to propagate to
dependent skills.

These skills were generated for **obsidian-pivi-cross**
by `fork-maintenance-flow-builder` (snapshot 1.1.0,
2026-07-11T15:32:02+00:00). The architecture is universal; the repo-specific
details come from `.fork-skills/profile.json`.

## Content-root scripts

The generator also writes a standalone executable next to the skills:

- **`upstream-status.sh`** — print how far the current branch lags/leads
  `upstream/main`. This is the loop's
  disturbance signal: `behind` = how stale the branch is, `ahead` = how many
  custom commits sit on top. Run it for a quick sync-health reading without a
  full sync:

  ```bash
  ./.fork-skills/upstream-status.sh            # default branch: main
  ./.fork-skills/upstream-status.sh <branch>   # override upstream branch
  ```

## Shared Notation

The sync-related skills use consistent notation:

| Code | Meaning |
|------|---------|
| **v1** | Upstream tag the branch is currently based on |
| **v2** | Target upstream tag to sync onto |
| **b1** | Branch before syncing (custom commits on top of v1) |
| **b2** | Branch after syncing (custom commits replayed onto v2) |

## Dependency Graph

```
auto-cherry-pick
├── detect-upstream-base
└── cherry-pick-assistant
    └── test-runner
        └── install-env
```

## Skills

| Skill | Purpose | Depends on |
|-------|---------|------------|
| [install-env](skills/install-env/SKILL.md) | Set up the dev environment and install in editable mode | — |
| [test-runner](skills/test-runner/SKILL.md) | Run tests locally, reproduce CI failures | install-env |
| [detect-upstream-base](skills/detect-upstream-base/SKILL.md) | Detect the upstream tag (v1) the branch is based on | — |
| [cherry-pick-assistant](skills/cherry-pick-assistant/SKILL.md) | Cherry-Pick custom commits from v1 onto v2 with conflict resolution and verification | detect-upstream-base, test-runner |
| [auto-cherry-pick](skills/auto-cherry-pick/SKILL.md) | Check for new upstream releases and sync the fork onto the latest | detect-upstream-base, cherry-pick-assistant |

## Change Impact

When editing a skill, check whether downstream dependents need updating:

| If you change… | Also review… |
|----------------|--------------|
| install-env | test-runner (env setup steps) |
| test-runner | cherry-pick-assistant (Step 3 b1 gate, Step 6 b2 verification) |
| detect-upstream-base | cherry-pick-assistant (Step 1 v1 detection), auto-cherry-pick (Step 1) |
| cherry-pick-assistant | auto-cherry-pick (Step 4 invocation, Step 5 summary fields) |
| auto-cherry-pick | (no downstream dependents) |

## Regenerating

If the repo drifts from this snapshot (new CI, new package manager, new heavy
deps), re-run `fork-maintenance-flow-builder` to regenerate. The
`fork-skills-auditor` skill detects that drift automatically against
`.fork-skills/profile.json`. The skills themselves live under
`.fork-skills/skills/`; `.agents/skills/` holds symlinks so harnesses that scan
it (pi, Cursor, …) discover them.
