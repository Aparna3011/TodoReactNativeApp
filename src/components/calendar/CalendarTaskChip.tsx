import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import type { Todo } from '../../types/todo';

import { styles } from './calendarStyles';

type CalendarTaskChipProps = {
  todo: Todo;
  onPress: () => void;
};

/**
 * A single task chip rendered inside a calendar day cell.
 *
 * Moved verbatim from CalendarScreen.
 */
function CalendarTaskChip({
  todo,
  onPress,
}: CalendarTaskChipProps): React.JSX.Element {
  const completed = todo.completed === 1;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.calendarTask,
        completed ? styles.calendarTaskCompleted : styles.calendarTaskPending,
      ]}
    >
      {completed && <Text style={styles.calendarTaskCheck}>✓</Text>}

      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={styles.calendarTaskText}
      >
        {todo.task_name}
      </Text>
    </TouchableOpacity>
  );
}

export default CalendarTaskChip;