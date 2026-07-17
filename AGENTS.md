# YaPi — agent operations guide

YaPi (id `yapi`) is an Obsidian community plugin embedding the **Pi agent** (`@earendil-works/pi-agent-core`) as its sole runtime, in a sidebar view and inline-edit modal. Min Obsidian `1.12.0` (provider keys via `app.secretStorage`).

This file holds **repo-wide invariants, build/test commands, and routing only.** Deeper content lives elsewhere:

- **Terminology / ubiquitous language** → `CONTEXT.md`
- **Architecture & package dependency maps** → `docs/architecture.md`
- **Quality snapshot / accumulated status** → `MEMORY.md`
- **Issue triage, labels, domain-doc conventions** → `docs/agents/*.md`

## Layered guidance

`AGENTS.md` files are orientation, not full maps. **Closest `AGENTS.md` to the edited file wins**; walk upward updating only while guidance stays accurate. Keep package-local explanations in `packages/*/AGENTS.md`; do not grow root guidance for package-local behavior.

## Build, test, lint

Node `>=24` (`.nvmrc`). `npm ci` installs (`.npmrc` sets `legacy-peer-deps=true`; postinstall seeds `.env.local` outside CI).

```bash
npm run typecheck        # tsc
npm run lint             # ESLint + simple-import-sort + obsidianmd rules (src/, tests/, packages/)
npm run lint:fix
npm run test             # Jest via scripts/run-jest.js (supplies Node localStorage file)
npm run test:coverage    # CI-strength coverage
npm run build            # CSS + esbuild bundle -> main.js + styles.css
npm run build:css        # concat/validate styles import graph (src/styles + packages/yapi-react/styles)
npm run dev              # watch mode
```

- **Build toolchain** lives in `build/` (`create-build-options.mjs`, `externals.mjs`, `plugins/*`, `postprocess/`); `esbuild.config.mjs` is a thin entry that defers to it. The `copy-to-obsidian` plugin deploys to `.obsidian/plugins/yapi` and prunes stale artifacts.

- **Run Jest only through `npm run test` / `scripts/run-jest.js`** — the wrapper supplies the Node localStorage file tests need. Do not invoke `npx jest` directly. Focused: one file `npm run test -- tests/unit/pi/piMcpBridge.test.ts`, by name `-t "..."`, by path fragment `tests/unit/utils`.
- **Pre-push gate:** `npm run typecheck && npm run lint && npm run check:boundaries && npm run test:coverage && npm run build`. Husky pre-commit runs `typecheck` + `lint` + `check:architecture`. **There is no CI** — run the full gate locally before pushing.

## Deploy to a vault (post-implementation)

Default after an impl the user must inspect: `npm run build && obsidian reload` (needs `.env.local` with `OBSIDIAN_VAULT`). Sanity: `obsidian dev:errors` → expect `No errors captured.` Deploy only `main.js`, `manifest.json`, `styles.css`; the esbuild `copy-to-obsidian` plugin prunes stale files — never copy CLI entrypoints or `node_modules` into `.obsidian/plugins/yapi/`.

## Architecture invariants (seams)

Diagrams: `docs/architecture.md`. Rules below are enforced by `npm run check:architecture` (`scripts/check-architecture-boundaries.mjs`):

- **Pi-only boundary.** App/UI/tools/host depend on YaPi-owned `@yapi/*` contracts, not raw `@earendil-works/*` or MCP SDKs. `packages/yapi-agent-core/src/engine/pi/` is the only Pi SDK import boundary.
- **Ports & DI.** `yapi-agent-core` (incl. `engine/pi`) depends on `ports/`, never `@yapi/obsidian-host`. Host capabilities (files, secrets, HTTP, process) arrive via app-layer DI.
- **UI over service contracts.** `src/ui/**` uses `PiChatService` / `AuxQueryRunner` (`@yapi/yapi-agent-core/runtime`), `getUiFacades()`, and narrow hosts (`YapiChatHost` / `YapiSettingsHost` via `@/app/hostPlatform`). Must not import `engine/pi/**`, `src/app/workspace/**`, or `@yapi/obsidian-host/**`.
- **One-way app → UI.** `src/app/workspace/**` must not import `@/ui/**`; host contracts must not import concrete view/workspace/engine types. The composition root may inject UI pieces.
- **Product-owned React presentation.** `packages/yapi-react` stays presentation-only and product-neutral: it may not import `@/` app code, `src/`, raw `@earendil-works/*` SDKs, `@yapi/obsidian-host`, or `@yapi/obsidian-tools`. `src/ui/**` reaches it only via approved presentation subpaths (`store`, `inline-edit`, `context-badges`). `src/app/ui/**` is the composition layer that bridges host services to the React shell.
- **Import bans:** host must not import runtime/skills/obsidian-tools; runtime must not import host; UI must not import runtime impl.

## Coding standards

1. **Comment why, not what.** Self-documenting code; comments explain non-obvious design choices/protocols/edge cases only.
2. **No `console.log` in production.** `console.error` only for caught init errors.
3. **Treat new `any`, `console`, complexity, and max-lines lint warnings as review blockers** unless justified.
4. **No new `!important` in CSS** (4 intentional overrides live in `inline-edit.css`).
5. **Sentence case** for settings/UI copy (ESLint `obsidianmd/ui/sentence-case`).
6. Keep important boundary/framework decisions in the nearest owning `AGENTS.md`.

### File naming

- `PascalCase.ts` when the primary export is a PascalCase class/component/modal/controller/manager/presenter/renderer (`MessageRenderer.ts`, `InputController.ts`).
- `lowerCamelCase.ts` for helpers, utils, data mappers, state helpers, and function/constant modules.
- `packages/*/src` defaults to lowerCamelCase; PascalCase only for a primary exported type/object that benefits from matching file + symbol.
- No UI-named facade files that only re-export package helpers — import from the owning `@yapi/*` package, or delete the unused facade.

### i18n (every commit)

Any user-visible UI text change must ship i18n **in the same commit**: add/update `src/i18n/locales/en.json` (canonical), mirror the key tree in all other `locales/*.json`, wire via `t('…')` from `@/i18n`. No new hard-coded UI strings. `packages/*` must not import `@/i18n` — pass translated strings from `src/`. Exemptions: technical ids (tool/model/provider ids), brand names as identifiers, raw user content. Details: `src/i18n/AGENTS.md`.

## Tool gotchas (non-obvious)

- **Vault-local MCP only.** `.yapi/mcp.json` + `.yapi/mcp-oauth/`; never read/write host-global MCP configs. `@server` in UI → `@server MCP` in the API prompt; vault MCP is exposed as one proxy `mcp` tool, not one tool per MCP tool.
- **External read tools** (`obsidian_read_external`, `obsidian_list_external`): gated by `allowExternalRead` + at least one allowed external dir (settings or current-session context); host-side realpath containment prevents reads outside those roots.
- **`obsidian_bash`:** off by default; `allowBash` + `bashAllowlist`; accepts one allowlisted single-line command and rejects shell control syntax before invoking the process runner.
- **No public vault-wide full-text search API** — YaPi implements scan-based search in `ObsidianVaultApi.searchNotes()`. No public task API — `obsidian_tasks` stays CLI-backed. Obsidian API reference: [obsidianmd/obsidian-api](https://github.com/obsidianmd/obsidian-api), [DeepWiki](https://deepwiki.com/obsidianmd/obsidian-api). Hybrid tool guidance: `packages/obsidian-tools/AGENTS.md`.

## Versioning

Local-only fork of `shuuul/obsidian-pivi`; no registry, no CI, no tags, no releases. Scheme `<yapi-core>-u<upstream>` (e.g. `0.1.0-u0.7.0` = YaPi iteration `0.1.0`, synced to upstream tag `0.7.0`); the `-u` suffix mirrors `.fork-skills/profile.json` `current_base_tag` and auto-cherry-pick bumps both together. To set a version: edit `version` in `package.json`, run `node scripts/sync-version.js` (syncs `manifest.json`, `versions.json`, README badge), update `CHANGELOG.md` by hand. Inherited upstream tags (`0.3.0`–`0.7.0`, bare) remain; any YaPi tag carries `-u`, so no tag-namespace collision.

## Repo-local skills

None tracked in-repo. Runtime vault skills live under each vault's `.yapi/skills/`. First vault load may prompt to install [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) — only after explicit user confirmation. If a repo-local skill is ever needed, add it intentionally with a matching lockfile entry and update this section in the same change.

## graphify

This project has a graphify knowledge graph at `graphify-out/`.

Rules:
- **Before answering any question about the codebase** (architecture, data flow, "what calls X", "how does Y work"):
  check if `graphify-out/graph.json` exists. If it does, run `graphify query "<question>"` immediately —
  do NOT read individual files first.
- Read `graphify-out/GRAPH_REPORT.md` once at session start for god nodes and community structure.
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw source files.
- After modifying any code files in this session, run `graphify update .` to keep the graph current
  (AST-only, no API cost).
- Use `graphify path "A" "B"` to trace the shortest path between two concepts.
- Use `graphify explain "NodeName"` for a plain-language explanation of any node.

## Agent skills

### Issue tracker

Issues live in the Multica workspace `yapi` (issue prefix `YAP`); two AFK agents (`builder`, `reviewer`) implement and review assigned issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Six canonical roles map 1:1 to workspace-scoped Multica labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`, `done`); in Multica each role is a label + status + assignee triple. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
