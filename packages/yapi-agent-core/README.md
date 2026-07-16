# @yapi/yapi-agent-core

## Purpose

`@yapi/yapi-agent-core` is the host-neutral aggregate entrypoint for YaPi's reusable agent foundation. It owns runtime/application contracts such as `ChatPorts`, tool protocol helpers, session storage, MCP services, and skill metadata without importing concrete host adapter or UI code. App composition owns concrete wiring, `@yapi/yapi-react` owns React presentation, and `src/ui` owns remaining product orchestration and imperative adapters. Package surfaces are exported as namespaces so similarly named contracts from different layers do not collide.

## Allowed dependencies

- `auth/` for host-neutral provider credential IDs, provider environment variable names, disabled-provider checks, and structural API-key/OAuth credential extraction.
- `foundation/` for shared contracts and defaults, including Obsidian tool gates such as external filesystem access and the Bash toggle/allowlist.
- `tools/` for the generic tool protocol and display models.
- `session/` for host-neutral session contracts, open-session state, paths, and metadata; Pi JSONL persistence and compatibility implementations live under `engine/pi/session/`.
- `mcp/` for workspace-local MCP management and proxy tools.
- `context/` and `prompt/` for host-neutral XML context formatting, runtime skill filtering, and registered-tool prompt assembly.
- `skills/` for skill and slash-command metadata helpers; runtime loaders exclude disabled vault skills while inventory loaders include them for settings and install prompts. Remote/default skill orchestration receives `HttpClient` and `ProcessRunner` ports from the host, and first-run confirmation is rendered through an injected host prompt callback rather than core-owned DOM.
- `runtime/`, `engine/`, and `engine/pi/` for host-neutral chat/runtime contracts, application-facing `ChatPorts`, auxiliary query services, queued-turn helpers, the generic AgentEngine seam, and Pi SDK adapter helpers.
- Canonical host-capability contracts under `@yapi/yapi-agent-core/ports`.

## Forbidden dependencies

- Concrete host SDKs, platform UI APIs, or concrete adapter packages (`@yapi/obsidian-host`, `@yapi/obsidian-tools`, `obsidian`, `electron`).
- Product app/UI imports such as `@/*`, `src/*`, `src/app/*`, or `src/ui/*`.
- Host platform wiring inside `engine/pi`: receive file/secret/HTTP/process capabilities only via `ports` and constructor injection.

## Public API

- Provider credential helpers under `@yapi/yapi-agent-core/auth`.
- Canonical host capability contracts under `@yapi/yapi-agent-core/ports`.
- Workspace context and client terminology under `@yapi/yapi-agent-core/workspace`.
- Declarative plugin/resource registry contracts under `@yapi/yapi-agent-core/plugins`.
- Namespaced foundation contracts/defaults under `@yapi/yapi-agent-core/foundation`.
- Namespaced tool protocol and canonical presentation/summary helpers under `@yapi/yapi-agent-core/tools`.
- Session contracts, paths, metadata, and linear open-session management under `@yapi/yapi-agent-core/session`; application ports open complete sessions by `sessionFile`, while concrete Pi JSONL tree compatibility stays under `@yapi/yapi-agent-core/engine/pi/session/*`.
- Skill helpers, slash-command catalog contracts, and built-in slash-command IDs under `@yapi/yapi-agent-core/skills`.
- MCP config, OAuth, server management, and proxy tools under `@yapi/yapi-agent-core/mcp`. Automatic prefetch warms enabled remote servers only; stdio servers start on explicit diagnostics or the first proxy search/list/call.
- Prompt context formatting, host-neutral mention parsing, and prompt builders under `@yapi/yapi-agent-core/context`, `@yapi/yapi-agent-core/context/mentions`, and `@yapi/yapi-agent-core/prompt`. MCP prompt inventory reflects settings-enabled servers and cached tool names.
- Runtime/application contracts, including `ChatPorts`, `PiChatService`, and `AuxQueryRunner`, under `@yapi/yapi-agent-core/runtime`.
- Generic AgentEngine contracts under `@yapi/yapi-agent-core/engine`.
- Pi SDK adapter helpers and Pi JSONL compatibility implementations under `@yapi/yapi-agent-core/engine/pi` use explicit leaf exports (including `engine/pi/session/*` and `engine/pi/shims/*`); add a matching `package.json` export when introducing a new app/test import path.

## See also

For detailed package boundaries and development guidance, see [AGENTS.md](AGENTS.md) in this directory.
