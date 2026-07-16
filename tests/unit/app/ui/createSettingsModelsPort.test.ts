import type { ChatUIOption } from '@yapi/yapi-agent-core/foundation/chatUi';
import { DEFAULT_YAPI_SETTINGS } from '@yapi/yapi-agent-core/foundation/settingsDefaults';

import type { YapiPluginWorkspace, YapiSettingsHost, YapiUiFacades } from '@/app/hostContracts';
import { createSettingsModelsPort } from '@/app/ui/createSettingsModelsPort';

function createHarness() {
  const settings = {
    ...DEFAULT_YAPI_SETTINGS,
    model: 'anthropic/claude-test',
    titleGenerationModel: 'anthropic/claude-test',
    agentSettings: {
      ...DEFAULT_YAPI_SETTINGS.agentSettings,
      addedProviders: ['anthropic', 'deepseek'],
      disabledProviders: ['anthropic'],
      visibleModels: ['anthropic/claude-test'],
      customProviders: [],
    },
  };
  const saveSettings = jest.fn(async () => undefined);
  const refreshModelPresentation = jest.fn();
  const deleteCredential = jest.fn(async () => undefined);
  const deepseekModel: ChatUIOption = {
    value: 'deepseek/deepseek-chat',
    label: 'DeepSeek Chat',
  };
  const host = {
    app: { secretStorage: undefined },
    settings,
    saveSettings,
    getAllViews: () => [{
      getChatHandle: () => ({ maintenance: { refreshModelPresentation } }),
    }],
  } as unknown as YapiSettingsHost;
  const uiFacades = {
    listModelsForProvider: (providerId: string) => providerId === 'deepseek' ? [deepseekModel] : [],
    syncCustomProviders: jest.fn(),
    getSettingsSnapshot: <T extends Record<string, unknown>>(value: T) => ({ ...value }),
    commitSettingsSnapshot: (target: Record<string, unknown>, snapshot: Record<string, unknown>) => {
      Object.assign(target, snapshot);
    },
  } as unknown as YapiUiFacades;
  const workspace = {
    credentialStore: {
      readSync: () => undefined,
      modify: async () => undefined,
      delete: deleteCredential,
    },
  } as unknown as YapiPluginWorkspace;

  return {
    deleteCredential,
    host,
    port: createSettingsModelsPort(host, uiFacades, workspace),
    refreshModelPresentation,
    saveSettings,
    settings,
    uiFacades,
  };
}

describe('createSettingsModelsPort provider removal', () => {
  it('restores in-memory provider order when saving settings fails', async () => {
    const harness = createHarness();
    harness.saveSettings.mockRejectedValueOnce(new Error('save failed'));

    await expect(harness.port.saveSettings({
      addedProviders: ['deepseek', 'anthropic'],
    })).rejects.toThrow('save failed');

    expect(harness.settings.agentSettings.addedProviders).toEqual(['anthropic', 'deepseek']);
    expect(harness.refreshModelPresentation).not.toHaveBeenCalled();
  });

  it('cleans provider settings and reconciles active and title models', async () => {
    const harness = createHarness();

    await harness.port.removeProvider('anthropic', false);

    expect(harness.settings.agentSettings).toMatchObject({
      addedProviders: ['deepseek'],
      disabledProviders: [],
      visibleModels: ['deepseek/deepseek-chat'],
      customProviders: [],
    });
    expect(harness.settings.model).toBe('deepseek/deepseek-chat');
    expect(harness.settings.titleGenerationModel).toBe('');
    expect(harness.deleteCredential).not.toHaveBeenCalled();
    expect(harness.saveSettings).toHaveBeenCalledTimes(1);
    expect(harness.refreshModelPresentation).toHaveBeenCalledTimes(1);
  });

  it('deletes the provider credential only when explicitly requested', async () => {
    const harness = createHarness();

    await harness.port.removeProvider('anthropic', true);

    expect(harness.deleteCredential).toHaveBeenCalledWith('anthropic');
  });

  it('does not select a disabled provider as the active fallback', async () => {
    const harness = createHarness();
    harness.settings.agentSettings.disabledProviders = ['anthropic', 'deepseek'];

    await harness.port.removeProvider('anthropic', false);

    expect(harness.settings.agentSettings.disabledProviders).toEqual(['deepseek']);
    expect(harness.settings.model).toBe('');
    expect(harness.settings.titleGenerationModel).toBe('');
  });

  it('fails before removing settings when requested credential storage is unavailable', async () => {
    const harness = createHarness();
    const workspaceWithoutCredentials = {} as YapiPluginWorkspace;
    const port = createSettingsModelsPort(
      harness.host,
      harness.uiFacades,
      workspaceWithoutCredentials,
    );

    await expect(port.removeProvider('anthropic', true)).rejects.toThrow(
      'Provider credential storage is unavailable.',
    );
    expect(harness.settings.agentSettings.addedProviders).toContain('anthropic');
  });
});
