# MEMORY.md

Accumulated quality status and learnings for YaPi. Dynamic, not stable rules —
when an entry becomes a stable rule, promote it to the relevant `AGENTS.md`.
Stable repo-wide invariants stay in root `AGENTS.md`; this file is the audit
backlog and fragile-state notes.

Last refreshed: 2026-07-11.

## Snapshot (2026-07-11)

Scope: repo config/source scan + `npm run test:coverage -- --runInBand`.

| Metric | Value |
|--------|-------|
| Unit test suites | 154 passed |
| Unit tests | 1104 passed |
| Coverage — lines | 32.57% |
| Coverage — functions | 23.51% |
| Coverage — branches | 28.49% |
| Source/style files (`src/**/*.ts`, `src/**/*.css`) | 260 |
| Test files (`tests/**/*.test.ts`) | 154 |
| `check:rename` gate | 701 files scanned, 0 stray legacy-id tokens |
| CSS `!important` in `src/styles/` | 4 (intentional, `inline-edit.css`) |
| ESLint `obsidianmd/ui/sentence-case` warnings | 0 |
| Bare swallowed async catches | 9 |
| `main.js` bundle | ~3.3 MB (~3,302,611 bytes) |

## High-value issues

1. Line coverage (~33%) is weak around chat controllers, renderers, settings modals, MCP UI, and tab lifecycle. The structural rebrand to yapi is mechanical (behavior-preserving) and added a `check:rename` completeness gate wired into `check:boundaries`.
2. ~~Large controller/UI classes~~ **Resolved** (2026-07-03): `ToolCallRenderer` (1350→225), `StreamController` (1157→404), `Tab.ts` (920→325), `MessageRenderer` (900→319), `InlineEditModal` (859→75), `InputController` (798→255), `YapiSettings` (792→184), `SlashCommandDropdown` (756→516), `InlineAskUserQuestion` (702→214) all split into focused modules under 600 lines; 3 complexity functions (`getToolLabel` 33→≤25, `handleKeyDown` 30→≤25, `renderAssistantContent` 29→≤25) reduced via dispatcher maps. Remaining large files: `SubagentManager`, `InputToolbar`, and the app composition root — split when next touched.
3. `PiChatService` should stay narrow; do not reintroduce placeholder callbacks or generic runtime capability flags. UI must keep using injected `PiChatService` factories — do not re-import `PiChatRuntime` from `src/ui/**`.
4. Remaining swallowed catches are mostly cleanup/fire-and-forget paths; add comments or low-noise warnings where user state could be affected.
5. `main.js` is ~3.3 MB; re-run `npm run analyze:bundle` after provider/runtime dependency changes.
6. CSS `!important` is at 4 intentional overrides in `inline-edit.css`; do not add new `!important` elsewhere.
7. Sentence-case lint is clean (0 warnings); keep new settings/UI copy compliant.

## Prioritized actions

| Priority | Action |
|----------|--------|
| P0 | Keep `npm run typecheck && npm run lint && npm run test:coverage && npm run build` green before releases. |
| P0 | Treat new `any`, `console`, complexity, and max-lines warnings as review blockers unless justified. |
| P0 | Update this file or the relevant owning `AGENTS.md` when a major quality item is resolved or deliberately deferred (avoid stale audit state). |
| P1 | Add focused tests for tab/session lifecycle: `TabManager`, `SessionController`, `tabRuntime`, `tabFork`. |
| P1 | Add MCP OAuth unhappy-path tests: `packages/yapi-agent-core/src/mcp/oauth/`, `McpVaultAuthStore`, settings auth UI boundaries. |
| P1 | Narrow no-op runtime callbacks during Pi-only simplification: `PiChatService`, `PiChatRuntime`, tab service callbacks. |
| P1 | Add renderer smoke tests for stored history: tool calls, subagents, ask-user, history recovery actions, write/edit blocks. |
| P2 | Extract small, behavior-named helpers only when touching that flow: `SubagentManager`, `InputToolbar`, app composition root. |
| P2 | Add comments/logging for remaining swallowed cleanup catches (OAuth cleanup, autosave/delete fire-and-forget paths). |

## Resolved

- ~~Move remaining UI `engine/pi` facades behind app ports~~ `getUiFacades()` wraps chat UI config, settings projection, model catalog, credential migration.
- ~~Reduce `!important` / fix sentence-case~~ (2026-07-03 maintenance wave).
- ~~Split max-lines files and reduce complexity~~ (2026-07-03): 9 files split, 3 complexity functions reduced.
