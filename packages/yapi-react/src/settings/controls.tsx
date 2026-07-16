import { type ChangeEvent, type ClipboardEvent, type ReactNode, useState } from 'react';

import { PlatformIcon } from '../icons';
import type { SettingsFeedbackMessage } from '../ports';

export interface SettingRowProps {
  readonly name: string;
  readonly description?: string;
  readonly children: ReactNode;
}

export function SettingsPageDescription({ children }: { readonly children: ReactNode }) {
  return <div className="yapi-settings-page-description">{children}</div>;
}

export function SettingsListHeader({
  title,
  actions,
}: {
  readonly title?: string;
  readonly actions?: ReactNode;
}) {
  return (
    <header className="yapi-settings-list-header">
      {title ? <SettingsSectionHeading>{title}</SettingsSectionHeading> : null}
      {actions ? <div className="yapi-settings-list-header__actions">{actions}</div> : null}
    </header>
  );
}

export function SettingsSectionHeading({
  children,
  id,
  level = 2,
}: {
  readonly children: ReactNode;
  readonly id?: string;
  readonly level?: 2 | 3;
}) {
  const Heading = level === 2 ? 'h2' : 'h3';
  const levelClass = level === 3 ? ' yapi-settings-section-heading--sub' : '';
  return (
    <Heading id={id} className={`yapi-settings-section-heading${levelClass}`}>
      {children}
    </Heading>
  );
}

export function SettingsSection({
  title,
  headingId,
  headingLevel = 2,
  children,
}: {
  readonly title: ReactNode;
  readonly headingId?: string;
  readonly headingLevel?: 2 | 3;
  readonly children: ReactNode;
}) {
  return (
    <section
      className="yapi-settings-section"
      {...(headingId ? { 'aria-labelledby': headingId } : {})}
    >
      <SettingsSectionHeading id={headingId} level={headingLevel}>
        {title}
      </SettingsSectionHeading>
      <div className="yapi-settings-section__body">{children}</div>
    </section>
  );
}

export function SettingRow({ name, description, children }: SettingRowProps) {
  return <div className="yapi-setting-row"><div className="yapi-setting-row__info"><div className="yapi-setting-row__name">{name}</div>{description ? <div className="yapi-setting-description">{description}</div> : null}</div><div className="yapi-setting-row__control">{children}</div></div>;
}

export function SettingsActionFeedback({ feedback }: { readonly feedback?: SettingsFeedbackMessage | null }) {
  if (!feedback) return null;
  return (
    <span
      className={`yapi-settings-action-feedback is-${feedback.kind}`}
      role={feedback.kind === 'error' ? 'alert' : 'status'}
    >
      {feedback.message}
    </span>
  );
}

export function Toggle({ checked, disabled = false, label, onChange }: { readonly checked: boolean; readonly disabled?: boolean; readonly label: string; readonly onChange: (checked: boolean) => void }) {
  return (
    <label
      className={`yapi-toggle${checked ? ' yapi-toggle--enabled' : ''}${disabled ? ' yapi-toggle--disabled' : ''}`}
    >
      <input
        aria-label={label}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span aria-hidden="true" className="yapi-toggle-thumb" />
    </label>
  );
}

export function Select({ value, children, label, onChange }: { readonly value: string; readonly children: ReactNode; readonly label?: string; readonly onChange: (value: string) => void }) {
  return <select className="yapi-select yapi-settings-control" value={value} aria-label={label} onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}>{children}</select>;
}

export function BadgeListInput({
  values,
  placeholder,
  inputLabel,
  removeLabel,
  disabled = false,
  feedback,
  onAdd,
  onRemove,
}: {
  readonly values: readonly string[];
  readonly placeholder?: string;
  readonly inputLabel: string;
  readonly removeLabel: (value: string) => string;
  readonly disabled?: boolean;
  readonly feedback?: SettingsFeedbackMessage | null;
  readonly onAdd: (values: readonly string[]) => boolean | Promise<boolean>;
  readonly onRemove: (value: string) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState('');
  const [committing, setCommitting] = useState(false);
  const commit = async (inputs: readonly string[]) => {
    const entries = inputs.map(value => value.trim()).filter(Boolean);
    if (entries.length === 0 || committing || disabled) return;
    setCommitting(true);
    try {
      if (await onAdd(entries)) setDraft('');
    } finally {
      setCommitting(false);
    }
  };
  const remove = async (value: string) => {
    if (committing || disabled) return;
    setCommitting(true);
    try {
      await onRemove(value);
    } finally {
      setCommitting(false);
    }
  };
  const pasteLines = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text');
    if (!/\r?\n/.test(text)) return;
    event.preventDefault();
    void commit([draft, ...text.split(/\r?\n/)]);
  };

  return (
    <div className="yapi-settings-badge-field">
      <div className="yapi-settings-badge-list">
        {values.map(value => (
          <span className="yapi-settings-badge" key={value}>
            <span className="yapi-settings-badge__text">{value}</span>
            <button
              type="button"
              className="yapi-settings-badge__remove"
              aria-label={removeLabel(value)}
              disabled={disabled || committing}
              onClick={() => { void remove(value); }}
            >
              <PlatformIcon name="x" />
            </button>
          </span>
        ))}
        <input
          className="yapi-settings-control yapi-settings-badge-input"
          aria-label={inputLabel}
          value={draft}
          placeholder={values.length === 0 ? placeholder : undefined}
          disabled={disabled || committing}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => { void commit([draft]); }}
          onPaste={pasteLines}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
            event.preventDefault();
            void commit([draft]);
          }}
        />
      </div>
      <SettingsActionFeedback feedback={feedback} />
    </div>
  );
}
