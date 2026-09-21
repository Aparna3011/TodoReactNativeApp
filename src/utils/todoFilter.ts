import type { Todo } from '../types/todo';

/** Status filter used on the Tasks screen. */
export type TodoFilter = 'all' | 'pending' | 'completed';

/**
 * Single source of truth for the Tasks screen list filtering.
 *
 * The search text is matched against the task name case-insensitively, as a
 * partial substring, with leading/trailing spaces ignored. It is always
 * AND-combined with the active status filter, so the result is exactly the
 * tasks that match BOTH conditions at once.
 *
 * Kept as a pure function (no SQLite / UI dependencies) so the full search
 * matrix can be unit tested in isolation, and so any future screen that
 * needs the same list semantics (for example a "Pending" view) reuses the
 * same rule instead of re-implementing it.
 */
export function filterTodos(
  todos: Todo[],
  filter: TodoFilter,
  searchQuery: string,
): Todo[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return todos.filter(todo => {
    if (filter === 'completed' && todo.completed !== 1) {
      return false;
    }

    if (filter === 'pending' && todo.completed !== 0) {
      return false;
    }

    if (
      normalizedQuery !== '' &&
      !todo.task_name.toLowerCase().includes(normalizedQuery)
    ) {
      return false;
    }

    return true;
  });
}