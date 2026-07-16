import { useT } from '../../i18n';
import { PlatformIcon } from '../../icons';
import type { ChatSurfaceActions } from '../types';

export function NavigationSurface({ visible, autoScrollEnabled, actions }: {
  visible: boolean;
  autoScrollEnabled: boolean;
  actions: ChatSurfaceActions;
}) {
  const t = useT();
  return (
    <div className={`yapi-nav-sidebar${visible ? ' visible' : ''}`}>
      <button aria-label={t('chat.nav.scrollToTop')} className="yapi-nav-btn yapi-nav-btn-top" onClick={actions.scrollToTop} type="button"><PlatformIcon name="chevrons-up" /></button>
      <button aria-label={t('chat.nav.previousMessage')} className="yapi-nav-btn yapi-nav-btn-prev" onClick={actions.scrollToPreviousUserMessage} type="button"><PlatformIcon name="chevron-up" /></button>
      <button aria-label={t('chat.nav.nextMessage')} className="yapi-nav-btn yapi-nav-btn-next" onClick={actions.scrollToNextUserMessage} type="button"><PlatformIcon name="chevron-down" /></button>
      <button aria-label={t('chat.nav.scrollToBottom')} className="yapi-nav-btn yapi-nav-btn-bottom" onClick={actions.scrollToBottom} type="button"><PlatformIcon name="chevrons-down" /></button>
      {!autoScrollEnabled ? <button aria-label={t('chat.nav.resumeAutoScroll')} className="yapi-nav-btn yapi-nav-btn-resume" onClick={actions.resumeAutoScroll} type="button"><PlatformIcon name="radio" /></button> : null}
    </div>
  );
}
