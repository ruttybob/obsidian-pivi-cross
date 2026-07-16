import type { YapiSettings } from '@yapi/yapi-agent-core/foundation';
import type { FileStore } from '@yapi/yapi-agent-core/ports';
import type { SlashCatalogEntry } from '@yapi/yapi-agent-core/skills/commands/slashCommandEntry';
import type { App, EventRef } from 'obsidian';

/** Obsidian lifecycle capabilities required while constructing app-owned services. */
export interface YapiWorkspaceHost {
  app: App;
  settings: YapiSettings;
  registerEvent(eventRef: EventRef): void;
  saveSettings(): Promise<void>;
  reconcileWorkspaceCommandEntries(entries: readonly SlashCatalogEntry[]): void;
}

export interface WorkspaceInitContext {
  host: YapiWorkspaceHost;
  vaultAdapter: FileStore;
}
