import { useState } from 'react';

import { useT } from '../../i18n';
import { PlatformIcon } from '../../icons';
import type { ChatUiSnapshot } from '../../store';

export function TodoSurface({ model }: {
  model: ChatUiSnapshot['currentTodoVisualizationModel'];
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(true);
  if (!model || model.items.length === 0) return null;
  const active = model.items.find(item => item.id === model.activeItemId);
  const progressParams = {
    completed: model.progress.completed,
    total: model.progress.total,
  };
  return (
    <div className="yapi-status-panel yapi-status-panel-todos">
      <button
        aria-expanded={expanded}
        aria-label={t(expanded ? 'chat.todos.collapse' : 'chat.todos.expand', progressParams)}
        className="yapi-status-panel-header"
        onClick={() => setExpanded(value => !value)}
        type="button"
      >
        <span className="yapi-status-panel-icon"><PlatformIcon name="list-todo" /></span>
        <span className="yapi-status-panel-label">{t('chat.todos.progress', progressParams)}</span>
        {!expanded && active ? <span className="yapi-status-panel-current">{active.activeForm ?? active.content}</span> : null}
        {!expanded && model.progress.completed === model.progress.total ? <span className="yapi-status-panel-status status-completed"><PlatformIcon name="check" /></span> : null}
      </button>
      {expanded ? (
        <div className="yapi-status-panel-content yapi-todo-panel" data-yapi-todo-source={model.source}>
          <div className="yapi-todo-panel-progress">
            <div className="yapi-todo-progress-summary">{t('chat.todos.progress', progressParams)}</div>
            <div className="yapi-todo-progress-meter"><div className="yapi-todo-progress-fill" style={{ width: `${model.progress.total ? (model.progress.completed / model.progress.total) * 100 : 0}%` }} /></div>
          </div>
          <div className="yapi-todo-panel-list yapi-todo-list-container">
            {model.items.map(item => (
              <div className={`yapi-todo-item yapi-todo-${item.status}`} key={item.id}>
                <span aria-hidden="true" className="yapi-todo-status-icon"><PlatformIcon name={item.status === 'completed' ? 'check' : 'dot'} /></span>
                <span className="yapi-todo-text">{item.status === 'in_progress' ? (item.activeForm ?? item.content) : item.content}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
