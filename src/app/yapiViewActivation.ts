import type { AppTabManagerState } from "@yapi/obsidian-host/bootstrap/types";
import { VIEW_TYPE_YAPI } from "@yapi/yapi-agent-core/foundation";
import type { ChatViewPlacement } from "@yapi/yapi-agent-core/foundation/settings";
import type { App, WorkspaceLeaf } from "obsidian";

import type { YapiChatView } from "@/app/hostContracts";
import { findYapiView } from "@/app/viewAccess";
import { revealWorkspaceLeaf } from "@/ui/shared/utils/obsidianCompat";

function getLeafForPlacement(
  app: App,
  placement: ChatViewPlacement,
): WorkspaceLeaf | null {
  const { workspace } = app;
  switch (placement) {
    case "main-tab":
      return workspace.getLeaf("tab");
    case "left-sidebar":
      return workspace.getLeftLeaf(false);
    case "right-sidebar":
      return workspace.getRightLeaf(false);
  }
}

export async function activateYapiView(
  app: App,
  placement: ChatViewPlacement,
): Promise<void> {
  const { workspace } = app;
  let leaf = workspace.getLeavesOfType(VIEW_TYPE_YAPI)[0];

  if (!leaf) {
    const newLeaf = getLeafForPlacement(app, placement);
    if (newLeaf) {
      await newLeaf.setViewState({
        type: VIEW_TYPE_YAPI,
        active: true,
      });
      leaf = newLeaf;
    }
  }

  if (leaf) {
    await revealWorkspaceLeaf(workspace, leaf);
  }
}

export function canCreateYapiTab(app: App): boolean {
  const hasYapiLeaf = app.workspace.getLeavesOfType(VIEW_TYPE_YAPI).length > 0;
  const view = findYapiView(app);
  const commands = view?.getChatHandle()?.commands;

  if (commands) {
    return commands.getState().canCreateTab;
  }

  if (hasYapiLeaf) {
    return false;
  }

  return true;
}

export async function ensureYapiViewOpen(
  app: App,
  placement: ChatViewPlacement,
): Promise<YapiChatView | null> {
  const existingView = findYapiView(app);
  if (existingView) {
    return existingView;
  }

  await activateYapiView(app, placement);
  return findYapiView(app);
}

/**
 * Open a new chat tab, avoiding an extra blank tab when cold-opening a view
 * that already restores its initial tab.
 */
export async function openYapiNewTab(
  app: App,
  placement: ChatViewPlacement,
  lastKnownTabManagerState: AppTabManagerState | null,
): Promise<void> {
  const existingView = findYapiView(app);
  if (existingView) {
    await existingView.getChatHandle()?.commands.createTab();
    return;
  }

  const restoredTabCount = lastKnownTabManagerState?.openTabs.length ?? 0;
  const view = await ensureYapiViewOpen(app, placement);
  if (!view) {
    return;
  }

  if (restoredTabCount === 0) {
    return;
  }

  await view.getChatHandle()?.commands.createTab();
}
