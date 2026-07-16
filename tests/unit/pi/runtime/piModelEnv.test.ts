import { configurePiAiModels } from '@yapi/yapi-agent-core/engine/pi/piAiModels';
import { resolvePiModel, resolvePiProviderAuth } from '@yapi/yapi-agent-core/engine/pi/piModelEnv';
import {
  ObsidianAuthContext,
  ObsidianCredentialStore,
} from '@yapi/yapi-agent-core/engine/pi/piProviderCredentialStore';
import { createMockYapiPluginStub, asYapiPlugin } from '../../../helpers/mockYapiPlugin';

describe('piModelEnv provider auth resolution', () => {
  afterEach(() => {
    configurePiAiModels({});
  });

  it('resolves credentials through pi-ai with SecretStorage taking precedence over env snippets', async () => {
    const stub = createMockYapiPluginStub({
      settings: {
        model: 'anthropic/mock-model',
        sharedEnvironmentVariables: 'ANTHROPIC_API_KEY=shared-env-key',
        agentSettings: {
          environmentVariables: 'ANTHROPIC_API_KEY=pi-env-key',
          selectedMode: 'default',
          visibleModels: ['anthropic/mock-model'],
        },
      },
    });
    const plugin = asYapiPlugin(stub);
    const store = new ObsidianCredentialStore(plugin.app.secretStorage);
    store.writeSync('anthropic', { type: 'api_key', key: 'stored-key' });
    configurePiAiModels({
      credentials: store,
      authContext: new ObsidianAuthContext(plugin),
    });

    const model = resolvePiModel(plugin, 'anthropic/mock-model');
    expect(model).not.toBeNull();

    const auth = await resolvePiProviderAuth(plugin, model!);

    expect(auth).toMatchObject({
      auth: { apiKey: 'stored-key' },
      source: 'stored credential',
    });
  });

  it('returns no auth for disabled providers even when env credentials exist', async () => {
    const stub = createMockYapiPluginStub({
      settings: {
        model: 'anthropic/mock-model',
        agentSettings: {
          disabledProviders: ['anthropic'],
          environmentVariables: 'ANTHROPIC_API_KEY=pi-env-key',
          selectedMode: 'default',
          visibleModels: ['anthropic/mock-model'],
        },
      },
    });
    const plugin = asYapiPlugin(stub);
    configurePiAiModels({
      credentials: new ObsidianCredentialStore(plugin.app.secretStorage),
      authContext: new ObsidianAuthContext(plugin),
    });

    const model = resolvePiModel(plugin, 'anthropic/mock-model');
    expect(model).not.toBeNull();

    await expect(resolvePiProviderAuth(plugin, model!)).resolves.toBeUndefined();
  });
});
