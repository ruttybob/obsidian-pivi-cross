# Changelog

All notable changes to YaPi are documented here. YaPi is a local-only fork of
`shuuul/obsidian-pivi`; it is not published to any registry. Versioning follows
a manual `<yapi-core>-u<upstream>` scheme (for example `0.1.0-u0.7.0` = YaPi
iteration `0.1.0`, synced to upstream tag `0.7.0`). The `-u<upstream>` suffix
mirrors `.fork-skills/profile.json`'s `current_base_tag`.

## [0.1.0-u0.7.0] - 2026-07-11

Initial YaPi release, established as a fully-rebranded soft fork of upstream
`shuuul/obsidian-pivi` tag `0.7.0`. See
`docs/adr/0001-rebrand-pivi-to-yapi-as-soft-fork.md`.

### Changed
- Full structural rebrand of every host-product token to the `yapi` / `Yapi` /
  `YAPI` identifier family, with the **YaPi** wordmark in display surfaces only.
- Obsidian plugin id renamed to `yapi`; vault-local data directory renamed to
  `.yapi/` (clean break — switchers move it once manually, no auto-migration).
- Internal package scopes renamed to `@yapi/*`; the aggregate package becomes
  `@yapi/yapi-agent-core`. The Pi engine layer (`engine/pi`,
  `@earendil-works/pi-agent-core`) is intentionally untouched.
- Authorship: manifest author `se.kostrov`; package metadata and LICENSE
  copyright `Yadro`. Upstream attribution to shuuul retained.
- App icon redrawn as a "YP" mark; tagline "YaPi — Pi, living in Yadro".

### Removed
- release-please configuration, manifest, and all GitHub Actions workflows
  (release-please, release, ci). Versioning is now manual and local; the Obsidian
  release invariant (tag equals manifest version) no longer applies.

### Added
- `scripts/rename-map.json` — single machine-readable source of truth for the
  rebrand, driving both the initial rename and future upstream cherry-pick
  translation.
- `scripts/apply-rename.mjs` generator and `scripts/check-rename.mjs`
  completeness check.
- `docs/adr/0001-rebrand-pivi-to-yapi-as-soft-fork.md` and `CONTEXT.md` glossary.
- Upstream sync is now a soft fork: manual cherry-pick guided by the rename map
  (see `.fork-skills/` skills).

### Fixed
- Closed `Yapi`->`YaPi` display leaks that Pass 2 of `apply-rename` missed because
  they live outside i18n/manifest/markdown: hardcoded UI literals (sidebar title,
  hotkey search, chat interrupt hint, skills install prompt), CSS Style Settings
  labels, OAuth callback pages, system prompts, and user-facing errors. The Pi
  engine, console prefixes, and code identifiers keep `Yapi`.
- Aligned `eslint.config.mjs` `brands`/`ignoreWords` to `YaPi`; the sentence-case
  rule was still endorsing `Yapi` as the brand form.
- `check-rename` now also flags quoted display-leak literals — a code-form `Yapi`
  wrapped in single or double quotes (which must read `YaPi`) — as a regression
  guard; `rename-map.json` documents the manual display surfaces Pass 2 cannot
  safely auto-transform (a blanket replace would corrupt `YapiPluginHost`).
- Routed the chat interrupt hint through i18n (`chat.stream.interrupted` /
  `interruptHint`) instead of a hardcoded duplicate.
