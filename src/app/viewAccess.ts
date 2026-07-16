import { VIEW_TYPE_YAPI } from '@yapi/yapi-agent-core/foundation';
import type { App } from 'obsidian';

import type { YapiChatView } from '@/app/hostContracts';

function isYapiView(view: unknown): view is YapiChatView {
  return typeof view === 'object'
    && view !== null
    && 'leaf' in view
    && 'getChatHandle' in view
    && typeof view.getChatHandle === 'function';
}

/** Find the first Yapi sidebar view (no cached reference on Plugin). */
export function findYapiView(app: App): YapiChatView | null {
  for (const leaf of app.workspace.getLeavesOfType(VIEW_TYPE_YAPI)) {
    const view: unknown = leaf.view;
    if (isYapiView(view)) return view;
  }
  return null;
}

/** All open Yapi sidebar views. */
export function findAllYapiViews(app: App): YapiChatView[] {
  const views: YapiChatView[] = [];
  for (const leaf of app.workspace.getLeavesOfType(VIEW_TYPE_YAPI)) {
    const view: unknown = leaf.view;
    if (isYapiView(view)) views.push(view);
  }
  return views;
}
