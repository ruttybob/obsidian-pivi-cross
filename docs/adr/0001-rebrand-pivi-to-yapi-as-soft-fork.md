# Rebrand Pivi → YaPi as a soft fork (full structural rename)

Context: this repo is a fork of `shuuul/obsidian-pivi` (product "Pivi"). We are
rebranding the fork's product to **YaPi** — a wordmark of **Ya**dro (the
owning company) + **Pi** (the embedded agent engine), "Pi, living in Yadro" —
and performing a full structural rename of every "pivi" token across code,
packages, identifiers, CSS, the Obsidian plugin id, and the vault data
directory. Technical id / lowercase prefix is `yapi`.

Decision: full structural rename (not brand-only), executed from a single
machine-readable rename map that is the source of truth for both the initial
rename and future upstream cherry-pick translation. We keep the upstream
relationship as a **soft fork**: the `upstream` remote and rebase skills stay,
but syncing happens via manual cherry-pick guided by the rename map rather than
raw `git rebase --onto` (which cannot follow the renames). Existing `.pivi/`
vault data is **not migrated** (clean break); switchers move it once.

**Pi** remains the engine's own name (`engine/pi/`,
`@earendil-works/pi-agent-core`); only the host product is YaPi.

## Considered Options

- **Rename depth:** brand-only vs brand+plugin-id vs full structural. Chose full
  structural for a clean, self-owned codebase.
- **Upstream sync:** hard fork (drop rebase infra) vs soft fork (keep it) vs
  hybrid. Chose soft fork to keep receiving upstream fixes; the rename map makes
  cherry-pick tractable.
- **Data dir:** rename+migrate vs rename no-migrate vs keep `.pivi/`. Chose
  rename no-migrate — migration code is fork-only surface and the switching base
  is small; a one-time manual `mv .pivi .yapi` is documented.
- **Aggregate package name:** mechanical `@yapi/yapi-agent-core` (uniform, 1:1
  with upstream) vs clean `@yapi/core`. Chose mechanical to keep the rebase
  translation map trivial.

## Consequences

- Every `git blame` line touching a renamed token attributes to the rebrand
  commit; use `git blame --follow` + the rename map to recover prior history.
- Raw `git rebase --onto` upstream no longer works; rebase skills require the
  rename-map translation step (manual cherry-pick in v1).
- Obsidian treats `yapi` as a new plugin id distinct from upstream `pivi`;
  installed `pivi` data (`.pivi/`, `pivi/data.json`) is not auto-adopted.
