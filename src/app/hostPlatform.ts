/**
 * App-layer host platform adapters for product UI.
 * UI must import path/vault helpers and host service contract types from here —
 * not from @yapi/obsidian-host.
 */
import { isOfficialObsidianCliEnabled, ObsidianVaultApi } from "@yapi/obsidian-host";
import {
  expandHomePath,
  getVaultPath,
  normalizePathForComparison,
  normalizePathForFilesystem,
  normalizePathForVault,
} from "@yapi/obsidian-host/path";
import type { App } from "obsidian";

export {
  expandHomePath,
  getVaultPath,
  isOfficialObsidianCliEnabled,
  normalizePathForComparison,
  normalizePathForFilesystem,
  normalizePathForVault,
};

export type {
  AppModelReadinessProvider,
  AppModelReadinessStatus,
  AppModelTestResult,
} from "@yapi/yapi-agent-core/foundation/modelReadiness";
export type {
  AppMcpOAuth,
  AppMcpServerProbeProvider,
  AppMcpServerTester,
  AppMcpStorage,
  AppMcpToolProvider,
  AppMcpToolSummary,
} from "@yapi/yapi-agent-core/mcp/ports";
export type {
  AppSkillProvider,
  AppSkillSummary,
} from "@yapi/yapi-agent-core/skills/skillProvider";

/** Notify Obsidian that a vault path changed (file history / UI refresh). */
export function triggerVaultModify(app: App, vaultRelativePath: string): void {
  const vaultApi = new ObsidianVaultApi(app);
  vaultApi.triggerVaultModify(vaultRelativePath);
}
