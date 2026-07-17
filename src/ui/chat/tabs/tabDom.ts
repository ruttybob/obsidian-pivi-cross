import type { App } from "obsidian";

import { t } from "@/app/i18n";
import { createMentionVaultLookup } from "@/ui/shared/mention/createMentionVaultLookup";

import { RichChatInput } from "../ui/RichChatInput";
import type { TabDOMElements } from "./types";

/**
 * Builds the DOM structure for a tab.
 */
export function buildTabDOM(
  contentEl: HTMLElement,
  app: App,
): TabDOMElements {
  const messagesWrapperEl = contentEl.createDiv({
    cls: "yapi-messages-wrapper",
  });
  const welcomePortalEl = messagesWrapperEl.createDiv({ cls: "yapi-react-welcome-slot" });
  const messagesEl = messagesWrapperEl.createDiv({ cls: "yapi-messages" });
  const messagesPortalEl = messagesEl.createDiv({ cls: "yapi-react-messages-slot" });
  const navigationPortalEl = messagesWrapperEl.createDiv({ cls: "yapi-react-navigation-slot" });
  const statusPanelContainerEl = messagesWrapperEl.createDiv({
    cls: "yapi-status-panel-container",
  });
  const todoPortalEl = statusPanelContainerEl.createDiv({ cls: "yapi-react-todo-slot" });
  const inputContainerEl = contentEl.createDiv({ cls: "yapi-input-container" });
  const queuePortalEl = inputContainerEl.createDiv({
    cls: "yapi-react-queue-slot",
  });
  const inputWrapper = inputContainerEl.createDiv({
    cls: "yapi-input-wrapper",
  });
  const contextRowEl = inputWrapper.createDiv({ cls: "yapi-context-row" });
  const richInput = new RichChatInput(inputWrapper, {
    placeholder: t("chat.composer.placeholder"),
    app,
    getMentionContext: () => ({
      vault: createMentionVaultLookup(app),
      mcpServerNames: new Set(),
    }),
  });
  richInput.el.setAttr("dir", "auto");
  const composerPortalEl = inputWrapper.createDiv({ cls: "yapi-react-composer-slot" });

  return {
    contentEl,
    messagesWrapperEl,
    messagesEl,
    messagesPortalEl,
    welcomePortalEl,
    todoPortalEl,
    navigationPortalEl,
    queuePortalEl,
    inputContainerEl,
    inputWrapper,
    richInput,
    composerPortalEl,
    contextRowEl,
    selectionIndicatorEl: null,
    browserIndicatorEl: null,
    canvasIndicatorEl: null,
    eventCleanups: [],
  };
}