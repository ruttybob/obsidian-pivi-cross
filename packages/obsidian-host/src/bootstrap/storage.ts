import type { FileStore } from "@yapi/yapi-agent-core/ports";

import type { AppTabManagerState } from "./types";

/**
 * Minimal shared app storage contract.
 *
 * This interface covers only storage concerns shared by app orchestration:
 * Yapi settings, tab manager state, and the vault file adapter used by Pi
 * product services.
 */
export interface SharedAppStorage {
  initialize(): Promise<{ yapi: Record<string, unknown> }>;
  saveYapiSettings(settings: Record<string, unknown>): Promise<void>;
  setTabManagerState(state: AppTabManagerState): Promise<void>;
  getTabManagerState(): Promise<AppTabManagerState | null>;
  setDeletedSessionFiles(sessionFiles: string[]): Promise<void>;
  getDeletedSessionFiles(): Promise<string[]>;
  getAdapter(): FileStore;
}
