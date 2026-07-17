import type { ChatIconSvg, ChatSvgChild } from '@yapi/yapi-agent-core/foundation';
import { type CSSProperties, useId } from 'react';

import { LucideIcon, PROVIDER_LOGOS, providerFallbackIcon } from '../icons/ProviderLogo';
import type { ComposerOptionSnapshot, DeepReadonly } from '../store';

function renderSvgChild(child: DeepReadonly<ChatSvgChild>, key: number) {
  if (child.tag === 'g') {
    return <g key={key} {...child.attributes}>{child.children.map((nested, index) => renderSvgChild(nested, index))}</g>;
  }
  return <path key={key} {...child.attributes} />;
}

function InlineChatIcon({ className, icon }: { className: string; icon: DeepReadonly<ChatIconSvg> }) {
  const generatedId = useId().replace(/:/g, '');
  if (icon.kind === 'yapi-brand') {
    const maskId = `yapi-model-brand-${generatedId}`;
    return <svg aria-hidden="true" className={className} fill="none" height="12" viewBox="0 0 100 100" width="12"><defs><mask id={maskId}><rect fill="black" height="100" width="100" /><g fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth={9}><path d="M17,24 L33,48 L49,24 M33,48 L33,76" /><path d="M65,76 L65,24 A15,15 0 0 1 65,54" /></g></mask></defs><rect fill="currentColor" height="100" mask={`url(#${maskId})`} width="100" /></svg>;
  }
  return <svg aria-hidden="true" className={className} fill="none" height="12" viewBox={icon.viewBox} width="12">{icon.kind === 'composite' ? icon.children.map((child, index) => renderSvgChild(child, index)) : <path d={icon.path} fill="currentColor" />}</svg>;
}

export function ModelOptionIcon({ option }: { option: DeepReadonly<ComposerOptionSnapshot> }) {
  const className = 'yapi-model-provider-icon';
  if (option.providerLogoSlug) {
    const dataUri = PROVIDER_LOGOS[option.providerLogoSlug];
    if (dataUri) {
      const style = {
        '--yapi-provider-logo-size': '12px',
        WebkitMaskImage: `url("${dataUri}")`,
        maskImage: `url("${dataUri}")`,
      } as CSSProperties;
      return <span aria-hidden="true" className={`yapi-provider-logo-mask ${className}`} style={style} />;
    }
    return <LucideIcon className={className} name={providerFallbackIcon(option.providerLogoSlug)} />;
  }
  if (option.chatIcon) return <InlineChatIcon className={className} icon={option.chatIcon} />;
  return <LucideIcon className={className} name={option.fallbackIcon ?? 'cpu'} />;
}
