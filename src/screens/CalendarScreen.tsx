import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SafeAreaScreen, { TAB_SCREEN_EDGES } from '../components/SafeAreaScreen';
import { useFocusEffect } from '@react-navigation/native';
import { CalendarDays } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';

import { getTodos } from '../database/todoRepository';
import type { Todo } from '../types/todo';

/** Formats a YYYY-MM-DD end date into a human-friendly label using local time. */
function formatDateLabel(endDate: string): string {
  const [year, month, day] = endDate.split('-').map(part => Number(part));

  if (!year || !month || !day) {
    return endDate;
  }

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getTodayDateString(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function CalendarScreen(): React.JSX.Element {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    getTodayDateString(),
  );
  const [taskModalVisible, setTaskModalVisible] = useState(false);

  const loadTodos = useCallback(async () => {
    try {
      const data = await getTodos();
      setTodos(data);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTodos();
    }, [loadTodos]),
  );

  /**
   * Group all todos by their end date.
   *
   * Example:
   * {
   *   "2026-09-14": [todo1, todo2, todo3],
   *   "2026-09-15": [todo4]
   * }
   */
  const todosByDate = useMemo(() => {
    const grouped: Record<string, Todo[]> = {};

    todos.forEach(todo => {
      if (!todo.end_date) {
        return;
      }

      if (!grouped[todo.end_date]) {
        grouped[todo.end_date] = [];
      }

      grouped[todo.end_date].push(todo);
    });

    return grouped;
  }, [todos]);

  const selectedTodos = useMemo(() => {
    return todosByDate[selectedDate] ?? [];
  }, [todosByDate, selectedDate]);

  /**
   * Mark dates that contain tasks.
   * Selection is also maintained here.
   */
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};

    todos.forEach(todo => {
      if (!todo.end_date) {
        return;
      }

      marked[todo.end_date] = {
        ...(marked[todo.end_date] ?? {}),
        marked: true,
      };
    });

    marked[selectedDate] = {
      ...(marked[selectedDate] ?? {}),
      selected: true,
    };

    return marked;
  }, [todos, selectedDate]);

  /**
   * Custom calendar day.
   *
   * This is what makes tasks appear INSIDE each date cell.
   */
  const renderDay = useCallback(
    ({
      date,
      state,
    }: {
      date?: {
        dateString: string;
        day: number;
        month: number;
        year: number;
        timestamp: number;
      };
      state?: string;
    }) => {
      if (!date) return null;

      const dateKey = date.dateString;
      const dayTodos = todosByDate[dateKey] ?? [];

      const isSelected = dateKey === selectedDate;
      const isDisabled = state === 'disabled';

      const visibleTodos = dayTodos.slice(0, 4);
      const remainingCount = dayTodos.length - visibleTodos.length;

      return (
        <View
          style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
        >
          {/* DATE NUMBER */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setSelectedDate(dateKey);

              if (dayTodos.length > 0) {
                setTaskModalVisible(true);
              }
            }}
            style={[
              styles.dayNumberContainer,
              isSelected && styles.dayNumberContainerSelected,
            ]}
          >
            <Text
              style={[
                styles.dayNumber,
                isDisabled && styles.dayNumberDisabled,
                isSelected && styles.dayNumberSelected,
              ]}
            >
              {date.day}
            </Text>
          </TouchableOpacity>

          {/* TASKS INSIDE DATE CELL */}
          <View style={styles.calendarTaskList}>
            {visibleTodos.map(todo => {
              const completed = todo.completed === 1;

              return (
                <TouchableOpacity
                  key={String(todo.id)}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedDate(dateKey);
                    setTaskModalVisible(true);
                  }}
                  style={[
                    styles.calendarTask,
                    completed
                      ? styles.calendarTaskCompleted
                      : styles.calendarTaskPending,
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
            })}

            {/* MORE TASKS */}
            {remainingCount > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedDate(dateKey);
                  setTaskModalVisible(true);
                }}
                style={styles.moreTasksContainer}
              >
                <Text style={styles.moreTasksText}>...</Text>
                {/* <Text style={styles.moreTasksText}>+{remainingCount} more</Text> */}
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [todosByDate, selectedDate],
  );

  return (
    <SafeAreaScreen style={styles.safeArea} edges={TAB_SCREEN_EDGES}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <CalendarDays size={24} color="#222222" />
          </View>

          <View>
            <Text style={styles.title}>Calendar</Text>

            <Text style={styles.subtitle}>View your tasks by date</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarWrapper}>
          <Calendar
            current={selectedDate}
            markedDates={markedDates}
            dayComponent={renderDay}
            onDayPress={day => {
              setSelectedDate(day.dateString);

              const dateTodos = todosByDate[day.dateString] ?? [];

              if (dateTodos.length > 0) {
                setTaskModalVisible(true);
              }
            }}
            theme={{
              backgroundColor: '#f7f7f7',
              calendarBackground: '#f7f7f7',
              textSectionTitleColor: '#777777',
              monthTextColor: '#222222',
              textMonthFontSize: 20,
              textMonthFontWeight: '700',
              arrowColor: '#222222',
              textDayHeaderFontSize: 13,
              textDayHeaderFontWeight: '600',
              todayTextColor: '#120ef8',
            }}
            style={styles.calendar}
          />
        </View>

        {/* ================= TASK MODAL ================= */}
        <Modal
          visible={taskModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setTaskModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            {/* Tap outside modal to close */}
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setTaskModalVisible(false)}
            />

            {/* Modal content */}
            <View style={styles.taskModal}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>
                    {formatDateLabel(selectedDate)}
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    {selectedTodos.length}{' '}
                    {selectedTodos.length === 1 ? 'task' : 'tasks'}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setTaskModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Tasks */}
              <FlatList
                data={selectedTodos}
                keyExtractor={item => String(item.id)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalTaskList}
                renderItem={({ item }) => {
                  const completed = item.completed === 1;

                  return (
                    <View style={styles.modalTaskRow}>
                      <View
                        style={[
                          styles.modalTaskIcon,
                          completed
                            ? styles.modalTaskIconCompleted
                            : styles.modalTaskIconPending,
                        ]}
                      >
                        {completed && <Text style={styles.modalCheck}>✓</Text>}
                      </View>

                      <View style={styles.modalTaskContent}>
                        <Text
                          style={[
                            styles.modalTaskName,
                            completed && styles.modalTaskNameCompleted,
                          ]}
                        >
                          {item.task_name}
                        </Text>

                        <Text
                          style={[
                            styles.modalTaskStatus,
                            completed
                              ? styles.modalStatusCompleted
                              : styles.modalStatusPending,
                          ]}
                        >
                          {completed ? 'Completed' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  );
                }}
              />
            </View>
          </View>
        </Modal>

        {/* Selected date information */}

        {/* Selected date information */}
        <View style={styles.selectedDateHeader}>
          <View style={styles.selectedDateInfo}>
            <Text style={styles.selectedDateTitle}>
              {formatDateLabel(selectedDate)}
            </Text>

            <Text style={styles.selectedDateSubtitle}>
              {selectedTodos.length === 0
                ? 'No tasks scheduled'
                : `${selectedTodos.length} ${
                    selectedTodos.length === 1 ? 'task' : 'tasks'
                  }`}
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{selectedTodos.length}</Text>
          </View>
        </View>

        {/* Selected date task list */}
        <FlatList
          data={selectedTodos}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.taskRow}>
              <View
                style={[
                  styles.taskDot,
                  item.completed === 1 && styles.taskDotCompleted,
                ]}
              />

              <View style={styles.taskTextContainer}>
                <Text
                  style={[
                    styles.taskName,
                    item.completed === 1 && styles.taskNameCompleted,
                  ]}
                >
                  {item.task_name}
                </Text>
              </View>

              <Text
                style={[
                  styles.taskStatus,
                  item.completed === 1
                    ? styles.taskStatusCompleted
                    : styles.taskStatusPending,
                ]}
              >
                {item.completed === 1 ? 'Completed' : 'Pending'}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No tasks yet</Text>

              <Text style={styles.emptySubtitle}>
                Tasks with end dates will appear inside their calendar dates.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ece8f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222222',
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: '#777777',
  },

  /* Calendar */
  calendarWrapper: {
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 4,
  },

  calendar: {
    backgroundColor: '#f7f7f7',
  },

  /*
   * Individual date cell.
   *
   * The height is intentionally larger than the
   * default calendar cell because tasks are displayed
   * inside it.
   */
  calendarDay: {
    width: '100%',
    minHeight: 92,
    paddingHorizontal: 3,
    paddingTop: 4,
    paddingBottom: 4,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },

  calendarDaySelected: {
    backgroundColor: '#eef2ff',
    borderRadius: 8,
  },

  /* Date number */
  dayNumberContainer: {
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },

  dayNumberContainerSelected: {
    alignSelf: 'center',
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#120ef8',
    marginBottom: 1,
  },

  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
  },

  dayNumberSelected: {
    color: '#ffffff',
  },

  dayNumberDisabled: {
    color: '#aaaaaa',
  },

  /* Tasks inside calendar */
  calendarTaskList: {
    width: '100%',
    gap: 2,
  },

  calendarTask: {
    width: '100%',
    minHeight: 19,
    borderRadius: 5,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },

  calendarTaskPending: {
    backgroundColor: '#4fa7a0',
  },

  calendarTaskCompleted: {
    backgroundColor: '#708bd0',
  },

  calendarTaskCheck: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    marginRight: 2,
  },

  calendarTaskText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },

  calendarTaskTextDisabled: {
    opacity: 0.65,
  },

  moreTasksContainer: {
    paddingHorizontal: 3,
    marginTop: 1,
  },

  moreTasksText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#666666',
  },

  /* Selected date section */
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  selectedDateInfo: {
    flex: 1,
  },

  selectedDateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
  },

  selectedDateSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#777777',
  },

  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  countBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Bottom task list */
  list: {
    padding: 16,
    paddingBottom: 32,
  },

  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 8,
  },

  taskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0b64b',
    marginRight: 10,
  },

  taskDotCompleted: {
    backgroundColor: '#4caf6d',
  },

  taskTextContainer: {
    flex: 1,
  },

  taskName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
  },

  taskNameCompleted: {
    color: '#558b2e',
    textDecorationLine: 'line-through',
  },

  taskStatus: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '600',
  },

  taskStatusPending: {
    color: '#b8860b',
  },

  taskStatusCompleted: {
    color: '#196509',
  },

  /* =========================
     TASK MODAL
     ========================= */

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  taskModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    minHeight: 250,
    paddingBottom: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  modalHeaderText: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#222222',
  },

  modalSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#777777',
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  closeButtonText: {
    fontSize: 28,
    lineHeight: 30,
    color: '#333333',
  },

  modalTaskList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },

  modalTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 8,
  },

  modalTaskIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  modalTaskIconPending: {
    backgroundColor: '#e0b64b',
  },

  modalTaskIconCompleted: {
    backgroundColor: '#4caf6d',
  },

  modalCheck: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  modalTaskContent: {
    flex: 1,
  },

  modalTaskName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
  },

  modalTaskNameCompleted: {
    color: '#777777',
    textDecorationLine: 'line-through',
  },

  modalTaskStatus: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
  },

  modalStatusPending: {
    color: '#b8860b',
  },

  modalStatusCompleted: {
    color: '#4caf6d',
  },

  /* Empty state */
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#333333',
  },

  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});

export default CalendarScreen;
