import { YapiSettingTabHost } from "@/app/ui/YapiSettingTabHost";
import type YapiPlugin from "@/main"

export function registerYapiSettings(plugin: YapiPlugin): void {
  plugin.addSettingTab(
    new YapiSettingTabHost(plugin.app, plugin, () => plugin.ensureWorkspaceServices()),
  );
}
