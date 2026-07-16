jest.mock('@/app/ui/YapiSettingTabHost', () => ({
  YapiSettingTabHost: jest.fn(),
}));

import { registerYapiSettings } from '@/app/settingsRegistration';
import { YapiSettingTabHost } from '@/app/ui/YapiSettingTabHost';

describe('registerYapiSettings', () => {
  it('injects the shared asynchronous workspace readiness callback', async () => {
    const firstWorkspace = { id: 'first' };
    const secondWorkspace = { id: 'second' };
    const ensureWorkspaceServices = jest.fn(async () => firstWorkspace);
    const addSettingTab = jest.fn();
    const plugin = {
      app: { id: 'app' },
      addSettingTab,
      ensureWorkspaceServices,
    };

    registerYapiSettings(plugin as never);

    expect(YapiSettingTabHost).toHaveBeenCalledTimes(1);
    const getWorkspace = jest.mocked(YapiSettingTabHost).mock.calls[0]?.[2];
    expect(getWorkspace).toEqual(expect.any(Function));
    expect(ensureWorkspaceServices).not.toHaveBeenCalled();
    await expect(getWorkspace?.()).resolves.toBe(firstWorkspace);

    ensureWorkspaceServices.mockResolvedValue(secondWorkspace);
    await expect(getWorkspace?.()).resolves.toBe(secondWorkspace);
    expect(addSettingTab).toHaveBeenCalledTimes(1);
  });
});
