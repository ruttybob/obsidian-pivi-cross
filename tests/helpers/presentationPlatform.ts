import {
  type PresentationPlatform,
  PresentationPlatformProvider,
} from '@yapi/yapi-react';
import { createElement, type ReactNode } from 'react';

export const testPresentationPlatform: PresentationPlatform = {
  getTerminology() {
    return {
      hostName: 'Test host',
      workspaceName: 'workspace',
      secureStorageName: 'secure storage',
    };
  },
  renderIcon(container, name) {
    container.dataset.testIcon = name;
  },
  attachTooltip(container, label) {
    container.title = label;
  },
};

export function withTestPresentationPlatform(children: ReactNode): ReactNode {
  return createElement(
    PresentationPlatformProvider,
    { children, platform: testPresentationPlatform },
  );
}
