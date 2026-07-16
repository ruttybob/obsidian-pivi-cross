import { PluginLogger } from '@yapi/yapi-agent-core/foundation/pluginLogger';

import type YapiPlugin from "@/main"

import { registerYapiCommands } from "./commandRegistration";
import { registerYapiSettings } from "./settingsRegistration";
import { measureStartupPhase } from "./startupPerformance";
import { findAllYapiViews } from "./viewAccess";
import { registerYapiViews } from "./viewRegistration";

const logger = new PluginLogger('PluginLifecycle');

export async function initializeYapiPlugin(plugin: YapiPlugin): Promise<void> {
  await measureStartupPhase('settings', () => plugin.loadSettings());
  registerYapiViews(plugin);
  registerYapiCommands(plugin);
  registerYapiSettings(plugin);

  plugin.app.workspace.onLayoutReady(() => {
    void plugin.ensureWorkspaceServices().catch((error: unknown) => {
      logger.error('Failed to initialize workspace services', error);
    });
  });
}

export async function persistOpenTabStates(
  plugin: YapiPlugin,
): Promise<void> {
  // Ensures state is saved even if Obsidian quits without calling onClose().
  const persistOperations: Promise<void>[] = [];
  const errors: unknown[] = [];
  for (const view of findAllYapiViews(plugin.app)) {
    try {
      const operation = view.getChatHandle()?.maintenance.persistState();
      if (operation) {
        persistOperations.push(operation);
      }
    } catch (error) {
      errors.push(error);
    }
  }
  const results = await Promise.allSettled(persistOperations);
  for (const result of results) {
    if (result.status === 'rejected') {
      errors.push(result.reason);
    }
  }

  if (errors.length === 1) {
    throw errors[0];
  }
  if (errors.length > 1) {
    throw new AggregateError(errors, 'Failed to persist open Yapi tab states.');
  }
}
