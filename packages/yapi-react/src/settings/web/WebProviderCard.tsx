import type { WebProviderId } from '@yapi/yapi-agent-core/foundation/settings';
import {
  type CSSProperties,
  Fragment,
  useState,
} from 'react';

import { useT } from '../../i18n';
import { ProviderLogo } from '../../icons';
import type { SettingsPorts, SettingsWebProviderSnapshot } from '../../ports';
import type { ProviderReorderHandleProps } from '../providers/useProviderReorder';

const MASKED_KEY = '••••••••';

const PROVIDER_LABELS: Record<WebProviderId, string> = {
  brave: 'Brave Search',
  tavily: 'Tavily',
  exa: 'Exa',
  anysearch: 'AnySearch',
};

export interface WebProviderCardProps {
  readonly provider: SettingsWebProviderSnapshot;
  readonly position: number;
  readonly disabled: boolean;
  readonly expanded: boolean;
  readonly pending: boolean;
  readonly dragging: boolean;
  readonly dragOffset: number;
  readonly secureStorageName: string;
  readonly ports: SettingsPorts;
  readonly onToggleExpanded: () => void;
  readonly onToggleDisabled: () => void;
  readonly reorderHandleProps: ProviderReorderHandleProps;
  readonly onError: () => void;
}

export function WebProviderCard(props: WebProviderCardProps) {
  const {
    provider,
    position,
    disabled,
    expanded,
    pending,
    dragging,
    dragOffset,
    secureStorageName,
    ports,
  } = props;
  const t = useT();
  const [key, setKey] = useState(provider.storedCredential ? MASKED_KEY : '');
  const [storedCredential, setStoredCredential] = useState(provider.storedCredential);
  const [credentialConfigured, setCredentialConfigured] = useState(provider.credentialConfigured);
  const [savingKey, setSavingKey] = useState(false);
  const label = PROVIDER_LABELS[provider.id];
  const status = disabled
    ? t('settings.webSearch.status.disabled')
    : credentialConfigured
      ? t('settings.webSearch.status.configured')
      : provider.apiKeyRequired
        ? t('settings.webSearch.status.missingKey')
        : t('settings.webSearch.status.anonymous');

  const saveKey = async (): Promise<void> => {
    const value = key.trim();
    if (!value || value === MASKED_KEY) return;
    setSavingKey(true);
    try {
      ports.complex.webSearch.writeCredential(provider.id, value);
      setKey(MASKED_KEY);
      setStoredCredential(true);
      setCredentialConfigured(true);
      await ports.complex.runtime.refreshPrompt();
    } catch {
      props.onError();
    } finally {
      setSavingKey(false);
    }
  };

  const clearKey = async (): Promise<void> => {
    setSavingKey(true);
    try {
      ports.complex.webSearch.clearCredential(provider.id);
      setKey('');
      setStoredCredential(false);
      setCredentialConfigured(provider.environmentCredential);
      await ports.complex.runtime.refreshPrompt();
    } catch {
      props.onError();
    } finally {
      setSavingKey(false);
    }
  };

  const style = dragging
    ? { '--yapi-provider-drag-y': `${dragOffset}px` } as CSSProperties
    : undefined;

  return <Fragment>
    <details
      className={`yapi-provider-card yapi-sortable-provider-card yapi-web-provider-card${disabled ? ' yapi-provider-card-disabled' : ''}${dragging ? ' is-dragging' : ''}`}
      data-provider-sort-id={provider.id}
      open={expanded}
      style={style}
    >
      <summary
        className="yapi-provider-header yapi-web-provider-header"
        onClick={event => { event.preventDefault(); props.onToggleExpanded(); }}
      >
        <button
          type="button"
          className="yapi-provider-drag-handle"
          aria-label={t('settings.webSearch.reorder.handle', { provider: label, position })}
          aria-pressed={dragging}
          onClick={event => { event.preventDefault(); event.stopPropagation(); }}
          {...props.reorderHandleProps}
        >
          <span aria-hidden="true">⠿</span>
        </button>
        <span className="yapi-provider-priority" aria-hidden="true">{position}</span>
        <div className="yapi-provider-title-row">
          <ProviderLogo slug={provider.id} size={18} className="yapi-provider-card-logo" />
          <span className="yapi-provider-title">{label}</span>
          <span className="yapi-web-provider-capabilities">
            {provider.search ? <span>{t('settings.webSearch.capability.search')}</span> : null}
            {provider.fetch ? <span>{t('settings.webSearch.capability.fetch')}</span> : null}
          </span>
        </div>
        <span className={`yapi-provider-status ${disabled ? 'disabled' : credentialConfigured ? 'configured' : 'missing'}`}>
          {status}
        </span>
        <button
          className="yapi-provider-disable-btn"
          type="button"
          disabled={pending}
          onClick={event => { event.preventDefault(); event.stopPropagation(); props.onToggleDisabled(); }}
        >
          {disabled ? t('common.enable') : t('common.disable')}
        </button>
      </summary>
      <div className="yapi-provider-body yapi-web-provider-body">
        <p className="yapi-setting-description">
          {provider.apiKeyRequired
            ? t('settings.webSearch.providerKeyRequired', { provider: label })
            : t('settings.webSearch.providerKeyOptional', { provider: label })}
        </p>
        <div className="yapi-web-provider-key-row">
          <input
            className="yapi-settings-control yapi-settings-control--fill"
            type="password"
            value={key}
            placeholder={key === MASKED_KEY
              ? t('settings.webSearch.apiKeySavedPlaceholder', { secureStorageName })
              : t('settings.webSearch.apiKeyPlaceholder')}
            disabled={savingKey}
            aria-label={t('settings.webSearch.apiKeyName', { provider: label })}
            onFocus={() => { if (key === MASKED_KEY) setKey(''); }}
            onChange={event => { setKey(event.currentTarget.value); }}
            onBlur={() => { void saveKey(); }}
          />
          <button
            type="button"
            disabled={savingKey || !storedCredential}
            onClick={() => { void clearKey(); }}
          >
            {t('settings.webSearch.removeKey')}
          </button>
        </div>
      </div>
    </details>
  </Fragment>;
}
