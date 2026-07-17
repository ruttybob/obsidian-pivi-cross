# Adopt the upstream React UI migration via re-platform sync

Status: accepted

Context: upstream `shuuul/obsidian-pivi` migrated its chat UI to React across the
`0.8.0`/`0.9.0` releases (`e97eb20` migrate chat surfaces to React → `a5bd1e0`
harden portable React boundaries): a new `packages/pivi-react` package (44
`.tsx`), a `src/app/ui` composition layer, a `build/` toolchain split, and an
architecture-boundary refactor (L0 map, `ChatPorts`, product-owned React UI). The
delta from our base `0.7.0` is 45 commits / 689 files. YaPi's UI is vanilla DOM
(`src/ui/**`, `src/styles/**`) and carries deliberate divergences (header-locked
tab bar, theme-aware toolbar icons, tab-switcher animation, YP brand icon) — all
on the pre-React surface that upstream removed.

Decision: **adopt the React migration in full.** Because the rebrand is a
full-tree rename, neither replaying fork commits onto `0.9.0` nor cherry-picking
upstream's 45 commits can bridge the rename + the UI re-platform. We
**re-platform**: start from the `0.9.0` tree, re-apply the `pivi→yapi` rebrand
via `scripts/apply-rename.mjs` (so the new React files are renamed too), then
re-layer fork identity/tooling and re-derive the behavioural UI customizations
on React. The rebrand's git history is squashed into a single re-apply; the
result is correct, which a rename-blind cherry-pick cannot be.

## Considered Options

- **Skip React, backport only non-React upstream changes.** Rejected: every
  future upstream UI commit is React-based, so skipping permanently cuts YaPi
  off from upstream UI evolution — an unmaintainable trajectory for a fork that
  exists to track upstream.
- **Spike-first to measure re-platform cost before committing.** Rejected: the
  rebrand tooling already proves the rename is mechanical, and the
  customizations are few and identified; the decision is clear enough to commit
  directly.
- **Sync direction:** replay fork onto `0.9.0` / cherry-pick upstream forward /
  re-platform. Chose **re-platform** — the only mechanically sound option for a
  rename-divergent fork. The rebrand must be *re-applied*, not replayed, to cover
  upstream's new files (`packages/pivi-react` did not exist in the historical
  rebrand commit).
- **Sequencing:** one-shot re-platform+re-derive vs two-track split. Chose
  **two-track**: validate a working 0.9.0 YaPi (green gate) before re-implementing
  the customizations on the unfamiliar React surface.

## Consequences

- YaPi gains `packages/yapi-react` and tracks upstream UI from `0.9.0` onward.
- The behavioural UI customizations are **not** auto-carried: header-lock,
  theme-aware toolbar icons, and tab-switcher animation must be re-derived on
  the React architecture (the YP brand icon ports with the rebrand). Tracked as
  the sync's Track 2.
- The fork's `scripts/check-architecture-boundaries.mjs` is a stale
  `@yapi/*`-renamed copy of upstream's now-evolved checker; it is reconciled
  (take upstream's, rename, re-layer fork invariants) as part of the re-platform.
- The rebrand's per-file history collapses into one re-apply commit; `git blame`
  for renamed tokens resolves to the re-platform commit (recover prior upstream
  blame via the `0.9.0` tag).
- `release-please` and GitHub workflows, which upstream still uses, are
  re-dropped after the re-platform (recurring manual step on every sync).
- The pre-existing `.scratch/sync-upstream-0.8.0` plan is **superseded** — it was
  captured before the React migration landed and does not account for it.
