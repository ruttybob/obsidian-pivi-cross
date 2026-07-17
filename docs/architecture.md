# YaPi architecture

Package and runtime maps for YaPi. Seam rules and invariants live in root
`AGENTS.md` (Architecture invariants); this file holds the diagrams.

## Composition and runtime ownership

```mermaid
flowchart TD
  Host["Obsidian plugin<br/>src/main.ts"] -- "bootstraps" --> App["App shell<br/>src/app"]
  Host -- "registers views/commands" --> UI["Product UI<br/>src/ui"]
  App -- "constructs via DI" --> Runtime["Pi engine<br/>packages/yapi-agent-core/engine/pi"]
  App -- "injects factories" --> UI
  UI -- "uses contracts" --> Core["Core contracts<br/>packages/yapi-agent-core/foundation"]
  UI -- "uses PiChatService" --> RuntimeContracts["Runtime contracts<br/>packages/yapi-agent-core/runtime"]
  UI -- "uses display models" --> Tools["Tool models<br/>packages/yapi-agent-core/tools"]
  UI -- "translates" --> I18n["i18n<br/>src/i18n"]
  Runtime -- "implements" --> RuntimeContracts
  Runtime -- "depends on ports" --> Ports["Ports<br/>packages/yapi-agent-core/ports"]
  Runtime -- "persists" --> Session["Session<br/>packages/yapi-agent-core/session"]
  Runtime -- "uses" --> MCP["MCP<br/>packages/yapi-agent-core/mcp"]
  Runtime -- "uses" --> Skills["Skills<br/>packages/yapi-agent-core/skills"]
  Runtime -- "formats prompts" --> Prompt["Prompt/context<br/>packages/yapi-agent-core/prompt + /context"]
  App -- "injects tool specs" --> ObsidianTools["Obsidian tools<br/>packages/obsidian-tools"]
  App -- "injects host adapters" --> Ports
  AgentCore["Yapi agent core aggregate<br/>packages/yapi-agent-core"] -- "owns" --> Core
  AgentCore -- "owns" --> Tools
  AgentCore -- "owns" --> Session
  AgentCore -- "owns" --> MCP
  AgentCore -- "owns" --> Skills
  AgentCore -- "owns" --> Prompt
  AgentCore -- "owns" --> Ports
  AgentCore -- "owns" --> RuntimeContracts
  AgentCore -- "owns" --> Runtime
  ObsidianTools -- "uses" --> ObsidianHost["Obsidian host adapters<br/>packages/obsidian-host"]
  ObsidianHost -- "implements" --> Ports
  Host -- "bundles" --> Style["CSS modules<br/>src/styles"]
  RuntimeContracts -- "streams chunks via service" --> UI
  Runtime -- "reads/writes via ports" --> Vault["Vault .yapi/*<br/>settings, MCP, sessions, skills"]
```

## Turn flow

```mermaid
flowchart LR
  User["User turn in chat composer"] -- "submit" --> Turn["buildTurnPrompt<br/>packages/yapi-agent-core/prompt"]
  Turn -- "MCP mention transform" --> Service["PiChatService<br/>injected by app"]
  Service -- "implemented by" --> Runtime["PiChatRuntime<br/>packages/yapi-agent-core/engine/pi"]
  Runtime -- "constructs Agent with injected tools" --> Agent["pi-agent-core Agent"]
  Agent -- "streams chunks" --> Adapter["PiAgentEventAdapter"]
  Adapter -- "normalized chunks" --> UI["Chat UI<br/>src/ui"]
  Runtime -- "append/read" --> Session["JSONL sessions<br/>packages/yapi-agent-core/session + .yapi/sessions"]
```

## Package dependency direction

`src/main.ts` and `src/app/` compose product semantics, while packages expose
narrower capabilities. `@yapi/obsidian-host` is host persistence/platform only
and implements `@yapi/yapi-agent-core/ports`; product settings defaults come from
`@yapi/yapi-agent-core/foundation`. The Pi engine must not import
`@yapi/obsidian-host` — host capabilities arrive through ports and app-layer DI.
Product UI must not construct `PiChatRuntime` or import `src/app/workspace/**`;
it receives `PiChatService` / `AuxQueryRunner` factories via the plugin host.

```mermaid
flowchart TD
  Main["src/main.ts<br/>Obsidian Plugin root"] --> App["src/app<br/>composition + lifecycle"]
  App --> UI["src/ui<br/>product UI"]
  App --> Host["@yapi/obsidian-host<br/>vault/files/settings persistence<br/>host platform adapters"]
  App --> Runtime["@yapi/yapi-agent-core/engine/pi<br/>PiChatRuntime + Pi settings/auth facades"]
  App --> ObsidianTools["@yapi/obsidian-tools<br/>concrete Obsidian tool specs"]
  App --> Skills["@yapi/yapi-agent-core/skills<br/>skills + slash-command catalog"]
  App --> Session["@yapi/yapi-agent-core/session<br/>JSONL session tree/store"]
  App --> Ports["@yapi/yapi-agent-core/ports"]

  UI --> Core["@yapi/yapi-agent-core/foundation<br/>contracts + defaults"]
  UI --> Tools["@yapi/yapi-agent-core/tools<br/>tool protocol + display models"]
  UI --> RuntimeContracts["@yapi/yapi-agent-core/runtime<br/>PiChatService + AuxQueryRunner"]
  UI --> Skills
  UI -. "type-only YapiPluginHost" .-> App

  Runtime --> Core
  Runtime --> Ports
  Runtime --> Tools
  Runtime --> Session
  Runtime --> MCP["@yapi/yapi-agent-core/mcp<br/>vault-local MCP + proxy tool"]
  Runtime --> Skills
  Runtime --> RuntimeContracts

  AgentCore["@yapi/yapi-agent-core<br/>host-neutral aggregate"] --> Core
  AgentCore --> Tools
  AgentCore --> Session
  AgentCore --> MCP
  AgentCore --> Skills
  AgentCore --> Prompt
  AgentCore --> Ports
  AgentCore --> RuntimeContracts
  AgentCore --> Runtime

  ObsidianTools --> Core
  ObsidianTools --> Tools
  ObsidianTools --> Host

  Host --> Core
  Host --> Ports
  Tools --> Core
  Session --> Core
  MCP --> Tools
  Skills --> Core
  Prompt --> Core

  App -. "injects settings codec" .-> Host
  App -. "constructs PiChatRuntime, injects into UI" .-> UI
  Core -. "DEFAULT_YAPI_SETTINGS" .-> App

  Host -. "must not import" .-> Runtime
  Host -. "must not import" .-> Skills
  Host -. "must not import" .-> ObsidianTools
  Runtime -. "must not import" .-> Host
  UI -. "must not import" .-> Runtime
  UI -. "must not import workspace impl" .-> App
```
