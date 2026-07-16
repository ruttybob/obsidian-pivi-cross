import { DEFAULT_YAPI_SETTINGS } from '@yapi/yapi-agent-core/foundation/settingsDefaults';
import type { YapiSettings } from '@yapi/yapi-agent-core/foundation/settings';

/** Default Yapi settings with optional overrides for tests. */
export function createMockYapiSettings(
  overrides: Partial<YapiSettings> = {},
): YapiSettings {
  return {
    ...DEFAULT_YAPI_SETTINGS,
    ...overrides,
    agentSettings: {
      ...DEFAULT_YAPI_SETTINGS.agentSettings,
      ...overrides.agentSettings,
    },
    keyboardNavigation: {
      ...DEFAULT_YAPI_SETTINGS.keyboardNavigation,
      ...overrides.keyboardNavigation,
    },
  };
}
