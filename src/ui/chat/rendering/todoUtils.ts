import type { TodoItem } from '@yapi/yapi-agent-core/tools/todo';
import { setIcon } from 'obsidian';

export function getTodoStatusIcon(status: TodoItem['status']): string {
  return status === 'completed' ? 'check' : 'dot';
}

export function getTodoDisplayText(todo: TodoItem): string {
  return todo.status === 'in_progress' ? (todo.activeForm ?? todo.content) : todo.content;
}

export function renderTodoItems(
  container: HTMLElement,
  todos: TodoItem[]
): void {
  container.empty();

  for (const todo of todos) {
    const item = container.createDiv({ cls: `yapi-todo-item yapi-todo-${todo.status}` });

    const icon = item.createSpan({ cls: 'yapi-todo-status-icon' });
    icon.setAttribute('aria-hidden', 'true');
    setIcon(icon, getTodoStatusIcon(todo.status));

    const text = item.createSpan({ cls: 'yapi-todo-text' });
    text.setText(getTodoDisplayText(todo));
  }
}
