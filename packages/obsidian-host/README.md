# @yapi/obsidian-host

## Purpose

Obsidian host adapters and platform services: vault API wrapper, file stores, shared plugin storage, settings persistence, keychain access types, CLI transport, process runner, vault/path helpers, and the Obsidian-to-YaPi theme-token mapping.

## Allowed dependencies

- Obsidian public API types/runtime imports.
- Node platform modules required for filesystem, path/home, HTTP, event, process, and CLI adaptation.
- Host-neutral contracts/defaults from `@yapi/yapi-agent-core/foundation`, `@yapi/yapi-agent-core/ports`, `@yapi/yapi-agent-core/session`, and `@yapi/yapi-agent-core/auth`.

## Forbidden dependencies

- Raw Pi SDK packages (external Pi SDK packages).
- `@yapi/yapi-agent-core/engine/pi`, `@yapi/yapi-agent-core/skills`, or concrete Obsidian tool implementations; app composition injects product/runtime settings semantics through storage codecs.
- `@yapi/yapi-react` imports.
- Pi engine construction or Agent lifecycle imports.
- Concrete Obsidian tool specification imports.
- Being imported by `@yapi/yapi-agent-core/engine/pi` (host adapters are injected via `ports` by app composition).

## Public API

- The package root barrel exports `ObsidianVaultApi`, `ExternalFileApi`, file/storage adapters, settings persistence, CLI transport, `nodeFetch`, `obsidianHttpClient`, auth/legacy-auth adapters, `systemProcessRunner`, the external opener, and vault/path utilities. `package.json` also exposes curated `@yapi/obsidian-host/<leaf>` subpaths for cross-package consumers. Domain service and file-store/HTTP/process/opener contracts are defined by their owning `@yapi/yapi-agent-core` modules.
- Base-file view lookup resolves the requested path directly; unresolved-link-only graph analysis reads `MetadataCache` without enumerating vault files. Search, tag, orphan/deadend graph, Base listing, and other inventory operations still enumerate on explicit request.
- `styles/yapi-theme.css` maps Obsidian theme variables into the `--yapi-host-*` contract; the root CSS build prepends it as a direct input, and it contains no React component rules.

## See also

For detailed package boundaries and development guidance, see [AGENTS.md](AGENTS.md) in this directory.
