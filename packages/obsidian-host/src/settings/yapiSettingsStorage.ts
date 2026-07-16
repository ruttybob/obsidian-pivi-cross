import { PluginLogger } from '@yapi/yapi-agent-core/foundation/pluginLogger';
import type { AgentRuntimeSettings, YapiSettings } from "@yapi/yapi-agent-core/foundation/settings";
import { DEFAULT_YAPI_SETTINGS } from "@yapi/yapi-agent-core/foundation/settingsDefaults";
import type { FileStore } from "@yapi/yapi-agent-core/ports";

import { YAPI_SETTINGS_PATH } from "./storagePaths";

const logger = new PluginLogger('YapiSettingsStorage');

export { YAPI_SETTINGS_PATH };

export type StoredYapiSettings = YapiSettings;

export interface YapiSettingsNormalizationResult {
  settings: StoredYapiSettings;
  changed: boolean;
}

export interface YapiSettingsCodec {
  getDefaults(): StoredYapiSettings;
  normalize(stored: Record<string, unknown>): YapiSettingsNormalizationResult;
  updateAgentSettings(
    settings: StoredYapiSettings,
    updates: Partial<AgentRuntimeSettings>,
  ): void;
  prepareForSave?(settings: StoredYapiSettings): StoredYapiSettings;
}

export const DEFAULT_YAPI_SETTINGS_CODEC: YapiSettingsCodec = {
  getDefaults() {
    return { ...DEFAULT_YAPI_SETTINGS };
  },
  normalize(stored) {
    return {
      settings: { ...DEFAULT_YAPI_SETTINGS, ...stored },
      changed: false,
    };
  },
  updateAgentSettings(settings, updates) {
    settings.agentSettings = {
      ...settings.agentSettings,
      ...updates,
    };
  },
};

export class YapiSettingsStorage {
  constructor(
    private adapter: FileStore,
    private codec: YapiSettingsCodec = DEFAULT_YAPI_SETTINGS_CODEC,
  ) {}

  async load(): Promise<StoredYapiSettings> {
    if (!(await this.adapter.exists(YAPI_SETTINGS_PATH))) {
      return this.getDefaults();
    }

    const content = await this.adapter.read(YAPI_SETTINGS_PATH);
    let stored: Record<string, unknown>;
    try {
      stored = JSON.parse(content) as Record<string, unknown>;
    } catch (error) {
      logger.warn('settings JSON is invalid; using defaults', error);
      return this.getDefaults();
    }

    const { settings, changed } = this.codec.normalize(stored);
    if (changed) {
      await this.save(settings);
    }

    return settings;
  }

  async save(settings: StoredYapiSettings): Promise<void> {
    const stored = this.codec.prepareForSave?.(settings) ?? settings;
    const content = JSON.stringify(stored, null, 2);
    await this.adapter.write(YAPI_SETTINGS_PATH, content);
  }

  async exists(): Promise<boolean> {
    return this.adapter.exists(YAPI_SETTINGS_PATH);
  }

  async update(updates: Partial<StoredYapiSettings>): Promise<void> {
    const current = await this.load();
    await this.save({ ...current, ...updates });
  }

  async setLastModel(model: string): Promise<void> {
    const current = await this.load();
    this.codec.updateAgentSettings(current, {
      lastModel: model,
    });
    await this.save(current);
  }

  async setLastEnvHash(hash: string): Promise<void> {
    const current = await this.load();
    this.codec.updateAgentSettings(current, {
      environmentHash: hash,
    });
    await this.save(current);
  }

  private getDefaults(): StoredYapiSettings {
    return this.codec.getDefaults();
  }
}
