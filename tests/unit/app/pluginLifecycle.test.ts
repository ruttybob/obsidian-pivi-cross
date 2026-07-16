jest.mock('@/app/commandRegistration', () => ({ registerYapiCommands: jest.fn() }));
jest.mock('@/app/settingsRegistration', () => ({ registerYapiSettings: jest.fn() }));
jest.mock('@/app/viewRegistration', () => ({ registerYapiViews: jest.fn() }));

import { registerYapiCommands } from '@/app/commandRegistration';
import { initializeYapiPlugin } from '@/app/pluginLifecycle';
import { registerYapiSettings } from '@/app/settingsRegistration';
import { registerYapiViews } from '@/app/viewRegistration';

describe('initializeYapiPlugin', () => {
  it('registers surfaces before layout-ready workspace initialization', async () => {
    let onLayoutReady: (() => void) | null = null;
    const neverReady = new Promise<never>(() => undefined);
    const plugin = {
      app: {
        workspace: {
          onLayoutReady: jest.fn((callback: () => void) => {
            onLayoutReady = callback;
          }),
        },
      },
      loadSettings: jest.fn(async () => undefined),
      ensureWorkspaceServices: jest.fn(() => neverReady),
    };

    await initializeYapiPlugin(plugin as never);

    expect(registerYapiViews).toHaveBeenCalledWith(plugin);
    expect(registerYapiCommands).toHaveBeenCalledWith(plugin);
    expect(registerYapiSettings).toHaveBeenCalledWith(plugin);
    expect(plugin.ensureWorkspaceServices).not.toHaveBeenCalled();

    expect(onLayoutReady).not.toBeNull();
    (onLayoutReady as unknown as () => void)();
    expect(plugin.ensureWorkspaceServices).toHaveBeenCalledTimes(1);
  });
});
