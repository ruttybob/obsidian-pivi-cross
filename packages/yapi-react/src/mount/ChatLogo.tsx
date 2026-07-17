import type { ChatIconSvg, ChatSvgChild } from '@yapi/yapi-agent-core/foundation';
import { useId } from 'react';

function renderSvgChild(child: ChatSvgChild, key: number) {
  if (child.tag === 'g') {
    return (
      <g key={key} {...child.attributes}>
        {child.children.map((nested, index) => renderSvgChild(nested, index))}
      </g>
    );
  }
  return <path key={key} {...child.attributes} />;
}

export function ChatLogo({ icon }: { icon: ChatIconSvg | null }) {
  const generatedId = useId().replace(/:/g, '');
  if (!icon) return null;
  if (icon.kind === 'yapi-brand') {
    const maskId = `yapi-brand-cutout-${generatedId}`;
    return (
      <svg aria-hidden="true" className="yapi-brand-icon" fill="none" viewBox="0 0 100 100">
        <defs>
          <mask id={maskId}>
            <rect fill="black" height="100" width="100" />
            {/* YP monogram: Y (left) + P (right), white strokes cut out of the currentColor fill. */}
            <g fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth={9}>
              <path d="M17,24 L33,48 L49,24 M33,48 L33,76" />
              <path d="M65,76 L65,24 A15,15 0 0 1 65,54" />
            </g>
          </mask>
        </defs>
        <rect fill="currentColor" height="100" mask={`url(#${maskId})`} width="100" />
      </svg>
    );
  }
  return (
    <svg
      aria-hidden="true"
      className="yapi-brand-icon yapi-provider-icon"
      fill="none"
      height="18"
      viewBox={icon.viewBox}
      width="18"
    >
      {icon.kind === 'composite'
        ? icon.children.map((child, index) => renderSvgChild(child, index))
        : <path d={icon.path} fill="currentColor" />}
    </svg>
  );
}
