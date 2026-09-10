import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import type { Todo } from '../../types/todo';

import CalendarTaskChip from './CalendarTaskChip';
import { styles } from './calendarStyles';

/**
 * Date info passed by react-native-calendars to a custom day component.
 */
type CalendarDateData = {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
};

type CalendarDayProps = {
  date: CalendarDateData;
  state?: string;
  todos: Todo[];
  isSelected: boolean;
  isToday: boolean;
  onSelectDate: (dateKey: string) => void;
  onTaskPress: (todo: Todo) => void;
};

/**
 * Only two tasks are shown inside a calendar cell. The remaining
 * tasks are shown in the selected date section below.
 */
const MAX_VISIBLE_TASKS = 2;

/**
 * Custom day cell used by react-native-calendars' dayComponent.
 *
 * Moved verbatim from CalendarScreen.
 */
function CalendarDay({
  date,
  state,
  todos,
  isSelected,
  isToday,
  onSelectDate,
  onTaskPress,
}: CalendarDayProps): React.JSX.Element {
  const isDisabled = state === 'disabled';

  const visibleTodos = todos.slice(0, MAX_VISIBLE_TASKS);

  const remainingCount = todos.length - visibleTodos.length;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onSelectDate(date.dateString)}
      style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
    >
      {/* DATE NUMBER */}

      <View
        style={[
          styles.dayNumberContainer,
          isToday && styles.dayNumberContainerToday,
          isSelected && styles.dayNumberContainerSelected,
        ]}
      >
        <Text
          style={[
            styles.dayNumber,
            isDisabled && styles.dayNumberDisabled,
            isToday && styles.dayNumberToday,
            isSelected && styles.dayNumberSelected,
          ]}
        >
          {date.day}
        </Text>
      </View>

      {/* TASKS INSIDE CALENDAR CELL */}

      <View style={styles.calendarTaskList}>
        {visibleTodos.map(todo => (
          <CalendarTaskChip
            key={String(todo.id)}
            todo={todo}
            onPress={() => {
              onSelectDate(date.dateString);

              onTaskPress(todo);
            }}
          />
        ))}

        {/* MORE TASKS */}

        {remainingCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onSelectDate(date.dateString)}
            style={styles.moreTasksContainer}
          >
            <Text style={styles.moreTasksText}>+{remainingCount} more</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default CalendarDay;