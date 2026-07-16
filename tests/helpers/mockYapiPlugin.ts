import type { OpenSessionState } from "@yapi/yapi-agent-core/foundation";
import type { YapiSettings } from "@yapi/yapi-agent-core/foundation/settings";
import type { YapiUiFacades } from "@/app/hostContracts";
import type YapiPlugin from "@/main";
import { createMockApp, type MockAppOptions } from "./mockApp";
import { createMockYapiSettings } from "./mockYapiSettings";

export interface MockYapiPluginStub {
  app: ReturnType<typeof createMockApp>;
  settings: YapiSettings;
  storage: {
    saveYapiSettings: jest.Mock;
    getTabManagerState: jest.Mock;
    setTabManagerState: jest.Mock;
    getAdapter: jest.Mock;
    initialize: jest.Mock;
  };
  sessions: OpenSessionState[];
  persistTabManagerState: jest.Mock;
  getAllViews: jest.Mock;
  getAgentHostContext: jest.Mock;
  getVaultPath: jest.Mock;
  getUiFacades: jest.Mock;
  createChatService?: jest.Mock;
  createAuxQueryRunner?: jest.Mock;
}

export interface CreateMockYapiPluginStubOptions extends MockAppOptions {
  settings?: Partial<YapiSettings>;
  sessions?: OpenSessionState[];
}

/**
 * Partial YapiPlugin-shaped stub for features-layer tests that need plugin.settings / app.
 * Does not instantiate YapiPlugin (avoids main.ts bootstrap side effects).
 */
export function createMockYapiPluginStub(
  options: CreateMockYapiPluginStubOptions = {},
): MockYapiPluginStub {
  const app = createMockApp(options);
  const settings = createMockYapiSettings(options.settings);
  const storage = {
    saveYapiSettings: jest.fn().mockResolvedValue(undefined),
    getTabManagerState: jest.fn().mockResolvedValue(null),
    setTabManagerState: jest.fn().mockResolvedValue(undefined),
    getAdapter: jest.fn().mockReturnValue({}),
    initialize: jest.fn().mockResolvedValue({ yapi: settings }),
  };

  const stub: MockYapiPluginStub = {
    app,
    settings,
    storage,
    sessions: options.sessions ?? [],
    persistTabManagerState: jest.fn().mockResolvedValue(undefined),
    getAllViews: jest.fn().mockReturnValue([]),
    getAgentHostContext: jest.fn(),
    getVaultPath: jest.fn().mockReturnValue(options.vaultBasePath ?? "/mock-vault"),
    getUiFacades: jest.fn(() => createMockPiUiFacades()),
    createChatService: jest.fn(),
    createAuxQueryRunner: jest.fn(),
  };
  stub.getAgentHostContext.mockImplementation(() => ({
    settings: stub.settings as unknown as Record<string, unknown>,
    storage: stub.storage,
    vaultPath: "/mock-vault",
  }));
  return stub;
}

/** Cast stub to YapiPlugin for APIs that expect the full plugin type. */
export function asYapiPlugin(stub: MockYapiPluginStub): YapiPlugin {
  return stub as unknown as YapiPlugin;
}

/** Minimal Pi UI facades for features-layer unit tests. */
export function createMockPiUiFacades(
  overrides: Partial<YapiUiFacades> = {},
): YapiUiFacades {
  const { chatUIConfig: chatUIConfigOverride, ...rest } = overrides;
  return {
    chatUIConfig: {
      getModelOptions: () => [],
      isAdaptiveReasoningModel: () => false,
      getReasoningOptions: () => [],
      getDefaultReasoningValue: () => "low",
      getContextWindowSize: () => 200_000,
      isDefaultModel: () => false,
      applyModelDefaults: () => {},
      applyReasoningSelection: () => {},
      ...chatUIConfigOverride,
    },
    getSettingsSnapshot: (settings) => ({ ...settings }),
    commitSettingsSnapshot: () => {},
    listModelsForProvider: () => [],
    syncCustomProviders: () => {},
    fetchCustomProviderModels: async () => ({ count: 0 }),
    ...rest,
  };
}
