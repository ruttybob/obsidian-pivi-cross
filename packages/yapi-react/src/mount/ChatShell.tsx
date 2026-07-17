import { useSyncExternalStore } from 'react';

import { ChatLogo } from './ChatLogo';
import { ActiveTabSurfaces } from './surfaces';
import { ChatTabBar } from './tab-bar';
import type { ChatShellOptions } from './types';

export type { ChatShellOptions, ChatSurfaceActions, WelcomeQuoteAdapter } from './types';

export function ChatShell({
  ownerWindow,
  setImperativeContainer,
  shell,
}: {
  ownerWindow: Window;
  setImperativeContainer: (element: HTMLDivElement | null) => void;
  shell: ChatShellOptions;
}) {
  const snapshot = useSyncExternalStore(
    shell.store.subscribe,
    shell.store.getSnapshot,
    shell.store.getSnapshot,
  );
  const tabBar = <ChatTabBar ownerWindow={ownerWindow} shell={shell} />;

  return (
    <div
      className="yapi-react-chat-root yapi-container"
      data-yapi-react-surface="chat"
    >
      <header className="yapi-header">
        <div className="yapi-title-slot">
          <span className="yapi-logo"><ChatLogo icon={snapshot.chatIcon} /></span>
          <h4 className="yapi-title-text">Yapi</h4>
        </div>
        <div className="yapi-tab-bar-container">{tabBar}</div>
      </header>
      <div className="yapi-tab-content-container" ref={setImperativeContainer} />
      <ActiveTabSurfaces shell={shell} />
    </div>
  );
}
