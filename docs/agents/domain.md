# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout

Single-context repo. The canonical domain reference is:

- **`CONTEXT.md`** at the repo root — the canonical domain vocabulary. (The "Repo terminology glossary" section of the root `AGENTS.md`, if present, is a secondary fallback.)
- **`docs/adr/`** at the repo root for past architectural decisions.

There is no `CONTEXT-MAP.md`; do not look for per-context context files.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root (or the glossary section of root `AGENTS.md` if `CONTEXT.md` does not exist yet).
- **`docs/adr/`** — read ADRs that touch the area you're about to work in.

If a file doesn't exist, **proceed silently**. Don't flag its absence; don't suggest creating it upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates `CONTEXT.md` and ADRs lazily when terms or decisions actually get resolved.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md` (or the `AGENTS.md` glossary), respecting the "Use in code/docs" and "Avoid / legacy wording" columns. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR (or an architectural decision documented in `AGENTS.md`), surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
