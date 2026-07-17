# YaPi

YaPi is an Obsidian community plugin that embeds the Pi agent as its sole agent
runtime. This is the canonical terminology / ubiquitous-language reference for
the product — especially where the fork's branding diverges from its upstream
origin and where code/docs/persistence terms must stay consistent.

Use these terms when naming docs, UI concepts, types, and persistence fields.
Prefer the canonical term for new code.

## Brand language

**YaPi**:
This fork's host product — the Obsidian plugin that embeds Pi in a sidebar view
and inline-edit modal. Wordmark **YaPi** = **Ya**dro + **Pi** ("Pi, living in
Yadro"); the capital P signals that the engine is Pi. Technical id / lowercase
prefix is `yapi`.
_Avoid_: Pivi (legacy upstream name), «ядро Pi» or any Cyrillic form (the brand
is Latin only), "YAPI" read as a backronym such as "Yet Another Pi", "Yapi" as
the wordmark (the capital P is intentional).

**Yadro**:
The company that owns and copyrights YaPi. Latin "Yadro" — a proper company
name, not the Russian word «ядро».
_Avoid_: shuuul (the upstream original author — credited separately as the
origin, not as YaPi's owner).

**Pi**:
The external agent runtime that YaPi embeds. YaPi is "Pi by Yadro"; Pi keeps its
own name as the engine.
_Avoid_: calling the host product "Pi", or renaming the engine layer to "YaPi".

## Canonical terminology

### Architecture and runtime terms

| Term | Meaning | Use in code/docs | Avoid / legacy wording |
|---|---|---|---|
| **PiChatService** | Narrow UI/app-facing contract for the one Pi chat lifecycle: prepare turns, stream, sync session, rewind, cleanup. | UI and app service typing; only contract product UI may depend on for chat. | Generic `PiChatService` as a new abstraction. |
| **PiChatRuntime** | Concrete `PiChatService` implementation backed by an in-process Pi `Agent`. Constructed only in app composition (`createChatService`). | Runtime implementation, app factories, and engine tests. | Importing `PiChatRuntime` from `src/ui/**`. |
| **Pi engine subpath** | `@yapi/yapi-agent-core/engine/pi`, the owner of low-level Pi SDK imports, Pi prompts consumption, event adaptation, auth/model helpers, auxiliary queries, tool adaptation, and Obsidian-safe Pi SDK shims. | Package boundary docs and imports. | Scattering raw `@earendil-works/*` imports into UI/tools/host packages. |
| **YaPi ToolSpec** | Minimal tool protocol type owned by `@yapi/yapi-agent-core/tools`; concrete implementations return `ToolSpec` values before runtime adaptation. | Tool protocol, Obsidian tools, runtime registry. | Raw Pi `AgentTool` outside `@yapi/yapi-agent-core/engine/pi`. |
| **ObsidianHost** | Host abstraction/API wrapper in `@yapi/obsidian-host` for Obsidian vault, workspace, file store, paths, and editor selection. | Obsidian-facing package boundaries. | Direct Obsidian API imports in platform-neutral packages. |
| **Obsidian tool package** | `@yapi/obsidian-tools`, the concrete implementation package for Obsidian-backed YaPi tools. | Tool execution docs and imports. | Putting Obsidian tool execution in `@yapi/yapi-agent-core/tools` or UI renderers. |
| **Auxiliary query** | Short Pi run for title generation, refine, or inline edit, without a full chat session lifecycle. | Inline edit, title generation, refine flows. | Calling it a session or chat turn unless it persists into session history. |
| **Runtime state** | In-memory Pi `Agent` / `PiChatRuntime` state for an active tab. Rebuildable from session data. | Runtime sync and hydration. | Treating runtime state as the source of truth. |

### Session and message terms

| Term | Meaning | Use in code/docs | Avoid / legacy wording |
|---|---|---|---|
| **Session** | Durable chat conversation persisted as JSONL under `.yapi/sessions/`. | User-facing history/resume/fork docs, storage specs, persisted state. | Old chat-thread wording for durable identity. |
| **Session file** | Vault-relative `.jsonl` path for one persisted conversation. | Persisted tab state, session stores, history list. | Hiding it inside opaque `agentState`. |
| **SessionRef** | YaPi durable session identity, normally `{ sessionFile }` plus the JSONL header session id. | Runtime/UI/session handoff and tab restore. | Runtime ids, UI tab ids, or `leafId` as durable history identity. |
| **Leaf** / **leafId** | Pi JSONL compatibility detail for old tree-shaped session files. YaPi no longer restores a specific leaf; opening history restores the complete linear session. Fork creates a new session file from a selected entry. | Low-level Pi session compatibility only. | Using leaf selection as product history/restore state. |
| **Tab binding** | UI tab's durable binding to `sessionFile` plus draft UI state such as selected model. | Plugin `loadData` / `saveData` state and tab restore logic. | Deprecated chat-id fields or `leafId` as durable tab identity. |
| **Open session state** / **OpenSessionState** | In-memory UI projection of a session used while rendering and streaming an open tab. Rebuildable from JSONL. | Controllers, presenters, transient UI state. | Treating it as durable identity. |
| **openSessionId** | In-memory identifier for open session state. | Feature-layer tab/state lookup only. | Persisting it as tab restore identity. |
| **Turn** | One user submission plus resulting assistant/tool stream and persisted updates. | Runtime, prompt, streaming, tests. | “Message” when referring to the whole request/response cycle. |
| **Message** | A user/assistant/tool content item inside a turn/session. | Rendering, JSONL message entries, chat state. | “Message” for the whole session or turn lifecycle. |

### Prompt, MCP, and tool terms

| Term | Meaning | Use in code/docs | Avoid / legacy wording |
|---|---|---|---|
| **System prompt** | Long-lived agent instructions assembled by `@yapi/yapi-agent-core/prompt` and consumed by the Pi engine. | Runtime configuration, prompt architecture docs. | Per-message context payloads. |
| **Turn prompt** | Per-message payload built by runtime prompt helpers; may include context files XML and MCP mention transforms. | Turn preparation, prompt/context specs. | API-transformed prompt text as user-visible history. |
| **MCP mention** | User-facing `@server` token that becomes `@server MCP` in the API prompt via turn finalization. | Composer mentions, MCP context-saving semantics. | Exposing transformed API wording in visible user messages. |
| **Proxy MCP tool** | Single Pi tool `mcp` that searches/calls vault MCP servers instead of exposing one Pi tool per MCP tool. | Pi tool registry, MCP bridge docs. | Describing vault MCP tools as top-level Pi tools. |
| **Vault-local MCP** | `.yapi/mcp.json` plus `.yapi/mcp-oauth/`; YaPi does not read or write host-global MCP configs. | MCP settings, OAuth, storage docs. | Global paths such as `~/.config/mcp` or IDE host MCP configs. |
| **TodoVisualizationModel** | UI-facing todo projection derived from TodoWrite tool input: items, active item, progress counts, and source. | `@yapi/yapi-agent-core/tools`, todo presenters/renderers, session restore. | Parsing raw TodoWrite payloads in renderers. |
