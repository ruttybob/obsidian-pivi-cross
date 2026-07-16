import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

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
  const inputPortalContainer = shell.inputPortalContainer;
  const tabBar = <ChatTabBar ownerWindow={ownerWindow} shell={shell} />;

  return (
    <div
      className={`yapi-react-chat-root yapi-container${snapshot.position === 'header' ? ' yapi-container--header-mode' : ''}`}
      data-yapi-react-surface="chat"
    >
      <header className="yapi-header">
        <div className="yapi-title-slot">
          <span className="yapi-logo"><ChatLogo icon={snapshot.chatIcon} /></span>
          <h4 className="yapi-title-text">Yapi</h4>
        </div>
        {snapshot.position === 'header'
          ? <div className="yapi-tab-bar-container">{tabBar}</div>
          : null}
      </header>
      <div className="yapi-tab-content-container" ref={setImperativeContainer} />
      <ActiveTabSurfaces shell={shell} />
      {snapshot.position === 'input' && inputPortalContainer
        ? createPortal(
            <div className="yapi-input-nav-content">
              <div className="yapi-tab-bar-container">{tabBar}</div>
            </div>,
            inputPortalContainer,
          )
        : null}
    </div>
  );
}
