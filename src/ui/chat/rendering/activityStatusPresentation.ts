import type { ActivityStatus } from '@yapi/yapi-agent-core/foundation';
import {
  type ActivityStatusPresentation,
  getActivityStatusCountPresentations,
  getActivityStatusPresentation,
} from '@yapi/yapi-react/store';
import { setIcon } from 'obsidian';

import { t } from '@/app/i18n';

function renderActivityStatusIcon(
  container: HTMLElement,
  presentation: ActivityStatusPresentation,
): void {
  if (presentation.icon.kind === 'dot') {
    container.createSpan({ cls: 'yapi-status-icon-dot', attr: { 'aria-hidden': 'true' } });
  } else if (presentation.icon.kind === 'working') {
    const workingIconEl = container.createSpan({
      cls: 'yapi-working-icon',
      attr: { 'aria-hidden': 'true' },
    });
    setIcon(workingIconEl, 'loader-circle');
  } else {
    const iconEl = container.createSpan({ cls: 'yapi-activity-status-icon', attr: { 'aria-hidden': 'true' } });
    setIcon(iconEl, presentation.icon.name);
  }
}

export function renderActivityStatusContents(
  container: HTMLElement,
  status: ActivityStatus,
): ActivityStatusPresentation {
  const presentation = getActivityStatusPresentation(status, t);
  container.empty();
  container.setAttribute('aria-atomic', 'true');
  container.setAttribute('aria-live', 'polite');

  renderActivityStatusIcon(container, presentation);

  container.createSpan({
    cls: 'yapi-activity-status-label',
    text: presentation.label,
  });
  if (presentation.accessibleLabel) {
    container.setAttribute('aria-label', presentation.accessibleLabel);
  } else {
    container.removeAttribute('aria-label');
  }
  return presentation;
}

export function renderActivityStatusCountSummary(
  container: HTMLElement,
  statuses: readonly ActivityStatus[],
): void {
  const items = getActivityStatusCountPresentations(statuses, t);
  container.empty();
  container.setAttribute('aria-atomic', 'true');
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-label', items.map(item => item.countLabel).join(' / '));

  items.forEach((item, index) => {
    if (index > 0) {
      container.createSpan({
        cls: 'yapi-tool-step-group-status-separator',
        text: '/',
        attr: { 'aria-hidden': 'true' },
      });
    }
    const badge = container.createSpan({
      cls: `yapi-activity-status yapi-tool-status status-${item.status}`,
      attr: { 'aria-hidden': 'true' },
    });
    renderActivityStatusIcon(badge, item);
    badge.createSpan({ cls: 'yapi-activity-status-label', text: item.countLabel });
  });
}
