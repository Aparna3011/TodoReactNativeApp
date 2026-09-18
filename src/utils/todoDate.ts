import type { Todo } from '../types/todo';

/**
 * Single source of truth for "which tasks belong to a date".
 *
 * The Date Tasks screen filters with `end_date === date || start_date === date`
 * and the Calendar groups with the same rule. Importing these helpers from a
 * single module guarantees the calendar cell count and the Date Tasks screen
 * count can never disagree.
 *
 * A todo belongs to a date when that date is either its start date or its due
 * (end) date. A single todo is included at most once for a date, so tasks
 * whose start_date equals their end_date are never duplicated.
 */

export function isTodoScheduledOnDate(
  todo: Todo,
  dateKey: string,
): boolean {
  return todo.start_date === dateKey || todo.end_date === dateKey;
}

export type TodoStatus = 'COMPLETED' | 'OVERDUE' | 'DUE TODAY' | 'UPCOMING';

/**
 * Returns the current date in the local device timezone formatted as YYYY-MM-DD.
 * Does NOT use UTC conversion.
 */
export function getLocalTodayDateString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates a todo's current status dynamically:
 * - if completed === 1 -> COMPLETED
 * - else if end_date < today -> OVERDUE
 * - else if end_date === today -> DUE TODAY
 * - else if end_date > today -> UPCOMING
 */
export function getTodoStatus(
  todo: { completed: number; end_date: string },
  today: string = getLocalTodayDateString(),
): TodoStatus {
  if (todo.completed === 1) {
    return 'COMPLETED';
  }
  if (todo.end_date < today) {
    return 'OVERDUE';
  }
  if (todo.end_date === today) {
    return 'DUE TODAY';
  }
  return 'UPCOMING';
}

/** Todos scheduled for a date using the shared rule (Date Tasks screen). */
export function getTodosScheduledOnDate(
  todos: Todo[],
  dateKey: string,
): Todo[] {
  return todos.filter(todo => isTodoScheduledOnDate(todo, dateKey));
}

/**
 * Groups todos by every date they are scheduled on (their start date and
 * their due date), following the same rule as getTodosScheduledOnDate.
 *
 * For any date key the resulting array is exactly what getTodosScheduledOnDate
 * would return: a todo is listed at most once per date (a single-day task with
 * start_date === end_date is not pushed twice).
 */
export function groupTodosByDate(todos: Todo[]): Record<string, Todo[]> {
  const grouped: Record<string, Todo[]> = {};
  const seen = new Set<string>(); // `${dateKey}:${todo.id}` pairs already added

  const addTodoToDate = (dateKey: string, todo: Todo) => {
    if (!dateKey) {
      return;
    }

    const seenKey = `${dateKey}:${todo.id}`;
    if (seen.has(seenKey)) {
      return;
    }
    seen.add(seenKey);

    const list = grouped[dateKey] ?? (grouped[dateKey] = []);
    list.push(todo);
  };

  todos.forEach(todo => {
    // A task appears on the calendar on the day it begins (start_date) and
    // again on its deadline (end_date), exactly like the Date Tasks filter.
    addTodoToDate(todo.start_date, todo);
    addTodoToDate(todo.end_date, todo);
  });

  return grouped;
}