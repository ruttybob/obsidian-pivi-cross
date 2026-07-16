import type { ChatMessage, ImageAttachment } from '@yapi/yapi-agent-core/foundation';
import { memo, useEffect, useRef, useState } from 'react';

import { useT } from '../../i18n';
import { PlatformIcon } from '../../icons';
import type { ChatProjectionStore } from '../../store';
import {
  AssistantContentView,
  isAssistantToolOnlyMessage,
  messageHasVisibleAssistantContent,
} from './AssistantContentView';
import type { MessageContentAdapter, MessageContentAdapters, MessagePresentationActions } from './types';

const COPY_FEEDBACK_MS = 1500;

function AdapterSlot({ adapter, message }: {
  adapter: MessageContentAdapter<ChatMessage>;
  message: ChatMessage;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const ownerWindow = container.ownerDocument.defaultView;
    if (!ownerWindow) return;
    return adapter.mount(container, message, {
      generation: message.id,
      ownerDocument: container.ownerDocument,
      ownerWindow,
    });
  }, [adapter, message]);
  return <div className="yapi-message-adapter-slot" ref={ref} />;
}

function MessageImages({ images }: { readonly images: readonly ImageAttachment[] }) {
  const [activeImage, setActiveImage] = useState<ImageAttachment | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeImage) return;
    const ownerDocument = overlayRef.current?.ownerDocument ?? activeDocument;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveImage(null);
    };
    ownerDocument.addEventListener('keydown', onKeyDown);
    return () => ownerDocument.removeEventListener('keydown', onKeyDown);
  }, [activeImage]);

  return (
    <>
      <div className="yapi-message-images">
        {images.map(image => (
          <div className="yapi-message-image" key={image.id}>
            <img
              alt={image.name}
              onClick={() => setActiveImage(image)}
              src={`data:${image.mediaType};base64,${image.data}`}
            />
          </div>
        ))}
      </div>
      {activeImage ? (
        <div
          className="yapi-image-modal-overlay"
          onClick={event => {
            if (event.target === event.currentTarget) setActiveImage(null);
          }}
          ref={overlayRef}
        >
          <div className="yapi-image-modal">
            <img
              alt={activeImage.name}
              src={`data:${activeImage.mediaType};base64,${activeImage.data}`}
            />
            <div className="yapi-image-modal-close" onClick={() => setActiveImage(null)}>
              ×
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function InterruptIndicator() {
  const t = useT();
  return (
    <div className="yapi-text-block">
      <span className="yapi-interrupted">{t('chat.stream.interrupted')}</span>
      {' '}
      <span className="yapi-interrupted-hint">{t('chat.stream.interruptHint')}</span>
    </div>
  );
}

function UserContent({ contentAdapters, message }: { contentAdapters?: MessageContentAdapters; message: ChatMessage }) {
  const content = message.displayContent ?? message.content;
  if (!content && !message.images?.length) return null;
  return (
    <>
      {message.images?.length ? <MessageImages images={message.images} /> : null}
      {content
        ? contentAdapters?.userContent
          ? <AdapterSlot adapter={contentAdapters.userContent} message={message} />
          : <div className="yapi-text-block">{content}</div>
        : null}
    </>
  );
}

function MessageCopyButton({
  role,
  onCopy,
}: {
  role: ChatMessage['role'];
  onCopy: () => void | Promise<void>;
}) {
  const t = useT();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const ownerWindow = buttonRef.current?.ownerDocument.defaultView ?? activeWindow;
    const timeout = ownerWindow.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    return () => ownerWindow.clearTimeout(timeout);
  }, [copied]);

  const roleClass = role === 'user'
    ? 'yapi-user-msg-copy-btn'
    : 'yapi-assistant-msg-copy-btn';
  const ariaLabel = role === 'assistant'
    ? t('chat.messageActions.copyAgentResponseAriaLabel')
    : t('chat.messageActions.copyAriaLabel');

  return (
    <button
      aria-label={ariaLabel}
      className={`yapi-message-action-btn yapi-message-copy-btn ${roleClass}${copied ? ' copied' : ''}`}
      onClick={() => {
        void Promise.resolve(onCopy()).then(() => setCopied(true));
      }}
      ref={buttonRef}
      type="button"
    >
      <PlatformIcon name={copied ? 'check' : 'copy'} />
    </button>
  );
}

export interface MessageViewProps {
  readonly message: ChatMessage;
  readonly actions: MessagePresentationActions;
  readonly contentAdapters?: MessageContentAdapters;
  readonly hideActions?: boolean;
  readonly isStreaming?: boolean;
  readonly projectionStore?: ChatProjectionStore;
}

/** The sole React owner of a visible message shell and its action toolbar. */
export const MessageView = memo(function MessageView({ actions, contentAdapters, hideActions = false, isStreaming = false, message, projectionStore }: MessageViewProps) {
  const t = useT();
  const getLatestMessage = () => (
    projectionStore?.getMessageSnapshot(message.id) as ChatMessage | null
  ) ?? message;
  if (message.isRebuiltContext) return null;

  const hasVisibleAssistant = message.role === 'assistant' && messageHasVisibleAssistantContent(message);
  // HEAD: interrupt user messages, and interrupt assistants with no visible content, render as
  // an assistant shell that only contains the interrupt indicator.
  if (message.isInterrupt && (message.role === 'user' || !hasVisibleAssistant)) {
    return (
      <article className="yapi-message yapi-message-assistant" data-message-id={message.id} data-role="assistant">
        <div className="yapi-message-content" dir="auto">
          <InterruptIndicator />
        </div>
      </article>
    );
  }

  if (message.role === 'assistant' && !hasVisibleAssistant) return null;

  const canCopy = !hideActions && actions.canCopy(message);
  const showScroll = !hideActions && message.role === 'assistant';
  const showRedo = !hideActions && message.role === 'assistant' && actions.canRedo(message.id);
  const showFork = !hideActions && message.role === 'assistant' && actions.canFork(message);
  const showActions = canCopy || showScroll || showRedo || showFork;
  const roleActionsClass = message.role === 'user'
    ? 'yapi-user-msg-actions'
    : 'yapi-assistant-msg-actions';
  const toolOnlyClass = message.role === 'assistant' && isAssistantToolOnlyMessage(message)
    ? ' yapi-message-assistant-tool-only'
    : '';

  return (
    <article
      className={`yapi-message yapi-message-${message.role}${toolOnlyClass}`}
      data-message-id={message.id}
      data-role={message.role}
    >
      <div className="yapi-message-content" dir="auto">
        {message.role === 'user'
          ? <UserContent contentAdapters={contentAdapters} message={message} />
          : (
            <>
              <AssistantContentView contentAdapters={contentAdapters} isStreaming={isStreaming} message={message} projectionStore={projectionStore} />
              {message.isInterrupt ? <InterruptIndicator /> : null}
            </>
          )}
      </div>
      {showActions ? (
        <div className={`yapi-message-actions ${roleActionsClass}`}>
          {canCopy
            ? <MessageCopyButton role={message.role} onCopy={() => actions.copy(getLatestMessage())} />
            : null}
          {showScroll
            ? (
              <button
                aria-label={t('chat.messageActions.scrollToRecentUserAriaLabel')}
                className="yapi-message-action-btn yapi-message-scroll-user-btn"
                onClick={() => actions.scrollToRecentUser(message.id)}
                type="button"
              >
                <PlatformIcon name="user" />
              </button>
            )
            : null}
          {showRedo
            ? (
              <button
                aria-label={t('chat.redo.ariaLabel')}
                className="yapi-message-action-btn yapi-message-redo-btn"
                onClick={() => void actions.redo(message.id)}
                type="button"
              >
                <PlatformIcon name="refresh-cw" />
              </button>
            )
            : null}
          {showFork
            ? (
              <button
                aria-label={t('chat.fork.ariaLabel')}
                className="yapi-message-action-btn yapi-message-fork-btn"
                onClick={() => void actions.fork(message.id)}
                type="button"
              >
                <PlatformIcon name="git-fork" />
              </button>
            )
            : null}
        </div>
      ) : null}
    </article>
  );
});
