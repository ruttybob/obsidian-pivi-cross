import type { PiAgentSettingsView } from '@yapi/yapi-agent-core/foundation/settingsModelKey';

import { useT } from '../../i18n';
import type { SettingsCatalogPort } from '../../ports';
import { SettingsSectionHeading } from '../controls';

export interface ModelChecklistProps {
  readonly catalog: SettingsCatalogPort;
  readonly providerId: string;
  readonly settings: PiAgentSettingsView;
  readonly onToggleModel: (modelValue: string, checked: boolean) => void;
}

/** Candidate-model checkbox grid for one provider card body. */
export function ModelChecklist({
  catalog,
  providerId,
  settings,
  onToggleModel,
}: ModelChecklistProps) {
  const t = useT();
  const providerModels = catalog.listModelsForProvider(providerId);
  return (
    <>
      <SettingsSectionHeading level={3}>{t('settings.modelsTab.candidateModels')}</SettingsSectionHeading>
      <div className="yapi-models-checklist-grid">
        {providerModels.length === 0 ? (
          <div className="yapi-no-models-message">{t('settings.modelsTab.noModels')}</div>
        ) : (
          providerModels.map(model => {
            const inputId = `checkbox-${providerId}-${model.value}`.replace(/[^a-zA-Z0-9_-]/g, '-');
            const checked = settings.visibleModels.includes(model.value);
            return (
              <div className="yapi-model-checkbox-wrapper" key={model.value}>
                <input
                  id={inputId}
                  className="yapi-model-checkbox"
                  type="checkbox"
                  checked={checked}
                  onChange={event => onToggleModel(model.value, event.target.checked)}
                />
                <label className="yapi-model-checkbox-label" htmlFor={inputId}>
                  <span className="yapi-model-checkbox-title">{model.label}</span>
                  {model.description ? <span className="yapi-model-checkbox-desc">{model.description}</span> : null}
                </label>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
