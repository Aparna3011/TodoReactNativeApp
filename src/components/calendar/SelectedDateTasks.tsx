import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import type { Todo } from '../../types/todo';

import { styles } from './calendarStyles';

type SelectedDateTasksProps = {
  dateLabel: string;
  todos: Todo[];
  onAddTask: () => void;
  onToggle: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
};

/**
 * Selected date header (title, task count, Add Task button) plus the
 * list of tasks due on that date. All values and callbacks come from
 * CalendarScreen — this component never touches SQLite directly.
 *
 * Moved verbatim from CalendarScreen.
 */
function SelectedDateTasks({
  dateLabel,
  todos,
  onAddTask,
  onToggle,
  onEdit,
  onDelete,
}: SelectedDateTasksProps): React.JSX.Element {
  return (
    <View>
      {/* =================================================
          SELECTED DATE HEADER
          ================================================= */}

      <View style={styles.selectedDateHeader}>
        <View style={styles.selectedDateInfo}>
          <Text style={styles.selectedDateTitle}>{dateLabel}</Text>

          <Text style={styles.selectedDateSubtitle}>
            {todos.length === 0
              ? 'No tasks scheduled'
              : `${todos.length} ${todos.length === 1 ? 'task' : 'tasks'} scheduled`}
          </Text>
        </View>

        <View style={styles.selectedDateActions}>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{todos.length}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onAddTask}
            style={styles.addTaskButton}
          >
            <Text style={styles.addTaskButtonText}>+ Add Task</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* =================================================
          SELECTED DATE TASKS
          ================================================= */}

      <View style={styles.taskSection}>
        {todos.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No tasks yet</Text>

            <Text style={styles.emptySubtitle}>
              Add a task for this date using the button above.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onAddTask}
              style={styles.emptyAddButton}
            >
              <Text style={styles.emptyAddButtonText}>+ Add Task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          todos.map(todo => {
            const completed = todo.completed === 1;

            return (
              <View
                key={String(todo.id)}
                style={[styles.taskRow, completed && styles.taskRowCompleted]}
              >
                {/* CHECKBOX */}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onToggle(todo)}
                  style={[
                    styles.checkbox,
                    completed && styles.checkboxCompleted,
                  ]}
                >
                  {completed && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>

                {/* TASK CONTENT */}

                <View style={styles.taskTextContainer}>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.taskName,
                      completed && styles.taskNameCompleted,
                    ]}
                  >
                    {todo.task_name}
                  </Text>

                  <Text
                    style={[
                      styles.taskStatus,
                      completed
                        ? styles.taskStatusCompleted
                        : styles.taskStatusPending,
                    ]}
                  >
                    {completed ? 'Completed' : 'Pending'}
                  </Text>
                </View>

                {/* EDIT */}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onEdit(todo)}
                  style={styles.editButton}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>

                {/* DELETE */}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onDelete(todo)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

export default SelectedDateTasks;