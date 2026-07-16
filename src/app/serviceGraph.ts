import {
  SharedStorageService,
} from "@yapi/obsidian-host";
import { PiSessionStore } from "@yapi/yapi-agent-core/engine/pi/session/piSessionStore";
import type { FileStore } from "@yapi/yapi-agent-core/ports";
import type {
  DeviceLocalExternalContextStore,
  SessionStore,
} from "@yapi/yapi-agent-core/session";
import { assertBundledReactRuntime } from "@yapi/yapi-react";

import type { ObsidianDeviceLocalExternalContextStore } from "@/app/deviceLocalExternalContextStore";
import { t } from "@/app/i18n";
import { createYapiSettingsCodec } from "@/app/settings/yapiSettingsCodec";
import { createPiWorkspaceServices, type PiWorkspaceServices } from "@/app/workspace/PiWorkspaceServices"
import type YapiPlugin from "@/main"

export interface YapiServiceGraph {
  piWorkspace: PiWorkspaceServices;
}

export function createSharedStorage(
  plugin: YapiPlugin,
  externalContexts: ObsidianDeviceLocalExternalContextStore,
): SharedStorageService {
  return new SharedStorageService(plugin, createYapiSettingsCodec(externalContexts), {
    failedSaveTabLayout: t("host.failedSaveTabLayout"),
    failedSaveDeletedSessions: t("host.failedSaveDeletedSessions"),
  });
}

export function createSessionStore(
  vaultAdapter: FileStore,
  vaultPath: string,
  externalContexts: DeviceLocalExternalContextStore,
): SessionStore {
  return new PiSessionStore(vaultAdapter, vaultPath, externalContexts);
}

export async function createPluginServiceGraph(
  plugin: YapiPlugin,
): Promise<YapiServiceGraph> {
  assertBundledReactRuntime();
  const vaultAdapter = plugin.storage.getAdapter();
  const piWorkspace = await createPiWorkspaceServices({
    host: plugin,
    vaultAdapter,
  });

  return { piWorkspace };
}
