import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import SafeAreaScreen, { TAB_SCREEN_EDGES } from '../components/SafeAreaScreen';
import { useFocusEffect } from '@react-navigation/native';
import { CalendarDays } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';

import {
  addTodo,
  deleteTodo,
  getTodos,
  toggleTodo,
  updateTodo,
} from '../database/todoRepository';

import type { Todo } from '../types/todo';

/* =========================================================
   DATE HELPERS
   ========================================================= */

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

/**
 * IMPORTANT:
 * Store the selected calendar date using local calendar values.
 *
 * Do NOT use:
 * date.toISOString().split('T')[0]
 *
 * because UTC conversion can move the date by one day.
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function dateFromDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);

  return new Date(year, month - 1, day);
}

/* =========================================================
   CALENDAR SCREEN
   ========================================================= */

function CalendarScreen(): React.JSX.Element {
  const [todos, setTodos] = useState<Todo[]>([]);

  const [selectedDate, setSelectedDate] = useState<string>(
    getTodayDateString(),
  );

  /* Add/Edit modal */
  const [taskEditorVisible, setTaskEditorVisible] = useState(false);

  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const [taskName, setTaskName] = useState('');

  const [endDate, setEndDate] = useState<Date>(
    dateFromDateString(getTodayDateString()),
  );

  const [showDatePicker, setShowDatePicker] = useState(false);

  /*
   * Live "today" tracking.
   *
   * lastTodayRef remembers which date was "today" the last time this
   * screen was active, so a stale "today" selection can be advanced
   * to the real current date. setTodayTick forces a re-render when
   * the app comes back from the background so the calendar updates
   * immediately.
   */
  const lastTodayRef = useRef(getTodayDateString());

  const [, setTodayTick] = useState(0);

  /*
   * Which month the calendar should display. Updated only when
   * "today" rolls over into a new month, so the view follows the
   * live date after a midnight month roll-over. User navigation
   * with the calendar arrows is never overridden.
   */
  const [calendarAnchor, setCalendarAnchor] = useState(getTodayDateString());

  /* =======================================================
     LOAD TODOS
     ======================================================= */

  const loadTodos = useCallback(async () => {
    try {
      const data = await getTodos();
      setTodos(data);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  /* =======================================================
     LIVE "TODAY" SYNC
     ======================================================= */

  const syncToLiveToday = useCallback(() => {
    const today = getTodayDateString();

    const prevToday = lastTodayRef.current;

    /*
     * If the calendar was still pointing at what used to be "today"
     * (for example the app stayed open overnight), advance the
     * selection onto the new current date.
     *
     * A date the user picked manually is never overridden.
     */
    if (selectedDate === prevToday) {
      setSelectedDate(today);

      /*
       * If "today" moved into a different month, re-anchor the
       * visible month so the calendar keeps pointing at the new
       * current date even after a midnight month roll-over.
       */
      if (today.slice(0, 7) !== prevToday.slice(0, 7)) {
        setCalendarAnchor(today);
      }
    }

    lastTodayRef.current = today;
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      /*
       * Every time this tab gains focus, refresh "today" so the
       * calendar keeps pointing at the real current date.
       */
      syncToLiveToday();

      loadTodos();
    }, [syncToLiveToday, loadTodos]),
  );

  /*
   * The Calendar tab stays mounted while the app is backgrounded.
   * When the app comes back (possibly on a new day), refresh the
   * calendar so the today marker and the selection follow the
   * real current date.
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        syncToLiveToday();

        setTodayTick(tick => tick + 1);
      }
    });

    return () => subscription.remove();
  }, [syncToLiveToday]);

  /* =======================================================
     GROUP TODOS BY DATE
     ======================================================= */

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

  /* =======================================================
     SELECTED DATE TODOS
     ======================================================= */

  const selectedTodos = useMemo(() => {
    return todosByDate[selectedDate] ?? [];
  }, [todosByDate, selectedDate]);

  /* =======================================================
     CALENDAR MARKED DATES
     ======================================================= */

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

  /* =======================================================
     SELECT DATE
     ======================================================= */

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  /* =======================================================
     OPEN ADD TASK
     ======================================================= */

  const openAddTask = useCallback(() => {
    setEditingTodo(null);
    setTaskName('');

    /*
     * New task starts with the currently selected
     * calendar date.
     */
    setEndDate(dateFromDateString(selectedDate));

    setShowDatePicker(false);
    setTaskEditorVisible(true);
  }, [selectedDate]);

  /* =======================================================
     OPEN EDIT TASK
     ======================================================= */

  const openEditTask = useCallback((todo: Todo) => {
    setEditingTodo(todo);
    setTaskName(todo.task_name);

    /*
     * Existing end_date is stored as YYYY-MM-DD.
     */
    setEndDate(dateFromDateString(todo.end_date));

    setShowDatePicker(false);
    setTaskEditorVisible(true);
  }, []);

  /* =======================================================
     CLOSE ADD/EDIT MODAL
     ======================================================= */

  const closeTaskEditor = useCallback(() => {
    setTaskEditorVisible(false);
    setEditingTodo(null);
    setTaskName('');
    setEndDate(dateFromDateString(selectedDate));
    setShowDatePicker(false);
  }, [selectedDate]);

  /* =======================================================
     SAVE / UPDATE TASK
     ======================================================= */

  const saveTask = useCallback(async () => {
    const name = taskName.trim();

    if (!name) {
      Alert.alert('Task required', 'Please enter a task name.');
      return;
    }

    const date = formatDateLocal(endDate);

    try {
      if (editingTodo) {
        await updateTodo(editingTodo.id, name, date);
      } else {
        await addTodo(name, date);
      }

      /*
       * If the date was changed while editing,
       * show the date containing the task.
       */
      setSelectedDate(date);

      closeTaskEditor();

      await loadTodos();
    } catch (error) {
      console.error('Failed to save task:', error);

      Alert.alert('Error', 'Unable to save the task.');
    }
  }, [taskName, endDate, editingTodo, closeTaskEditor, loadTodos]);

  /* =======================================================
     COMPLETE / PENDING
     ======================================================= */

  const handleToggle = useCallback(
    async (todo: Todo) => {
      try {
        await toggleTodo(todo.id, todo.completed);

        await loadTodos();
      } catch (error) {
        console.error('Failed to update task status:', error);

        Alert.alert('Error', 'Unable to update task status.');
      }
    },
    [loadTodos],
  );

  /* =======================================================
     DELETE
     ======================================================= */

  const handleDelete = useCallback(
    (todo: Todo) => {
      Alert.alert('Delete Task', `Delete "${todo.task_name}"?`, [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTodo(todo.id);

              await loadTodos();
            } catch (error) {
              console.error('Failed to delete task:', error);

              Alert.alert('Error', 'Unable to delete the task.');
            }
          },
        },
      ]);
    },
    [loadTodos],
  );

  /* =======================================================
     CUSTOM CALENDAR DAY
     ======================================================= */

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
      if (!date) {
        return null;
      }

      const dateKey = date.dateString;

      const dayTodos = todosByDate[dateKey] ?? [];

      const isSelected = dateKey === selectedDate;

      const isDisabled = state === 'disabled';

      /*
       * Live "today": recomputed on every render, so the today marker
       * moves with the real current date (even inside a custom cell).
       */
      const isToday = dateKey === getTodayDateString();

      /*
       * Only show two tasks inside a calendar cell.
       * The remaining tasks are shown in the selected
       * date section below.
       */
      const visibleTodos = dayTodos.slice(0, 2);

      const remainingCount = dayTodos.length - visibleTodos.length;

      return (
        <View
          style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
        >
          {/* DATE NUMBER */}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleSelectDate(dateKey)}
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
          </TouchableOpacity>

          {/* TASKS INSIDE CALENDAR CELL */}

          <View style={styles.calendarTaskList}>
            {visibleTodos.map(todo => {
              const completed = todo.completed === 1;

              return (
                <TouchableOpacity
                  key={String(todo.id)}
                  activeOpacity={0.7}
                  onPress={() => {
                    handleSelectDate(dateKey);

                    openEditTask(todo);
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
                onPress={() => handleSelectDate(dateKey)}
                style={styles.moreTasksContainer}
              >
                <Text style={styles.moreTasksText}>+{remainingCount} more</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [todosByDate, selectedDate, handleSelectDate, openEditTask],
  );

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <SafeAreaScreen style={styles.safeArea} edges={TAB_SCREEN_EDGES}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* =================================================
              HEADER
              ================================================= */}

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <CalendarDays size={24} color="#222222" />
            </View>

            <View>
              <Text style={styles.title}>Calendar</Text>

              <Text style={styles.subtitle}>View your tasks by date</Text>
            </View>
          </View>

          {/* =================================================
              CALENDAR
              ================================================= */}

          <View style={styles.calendarWrapper}>
            <Calendar
              current={selectedDate}
              initialDate={calendarAnchor}
              markedDates={markedDates}
              dayComponent={renderDay}
              onDayPress={day => {
                handleSelectDate(day.dateString);
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

          {/* =================================================
              SELECTED DATE HEADER
              ================================================= */}

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
                    } scheduled`}
              </Text>
            </View>

            <View style={styles.selectedDateActions}>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {selectedTodos.length}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={openAddTask}
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
            {selectedTodos.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No tasks yet</Text>

                <Text style={styles.emptySubtitle}>
                  Add a task for this date using the button above.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={openAddTask}
                  style={styles.emptyAddButton}
                >
                  <Text style={styles.emptyAddButtonText}>+ Add Task</Text>
                </TouchableOpacity>
              </View>
            ) : (
              selectedTodos.map(todo => {
                const completed = todo.completed === 1;

                return (
                  <View
                    key={String(todo.id)}
                    style={[
                      styles.taskRow,
                      completed && styles.taskRowCompleted,
                    ]}
                  >
                    {/* CHECKBOX */}

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleToggle(todo)}
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
                      onPress={() => openEditTask(todo)}
                      style={styles.editButton}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>

                    {/* DELETE */}

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleDelete(todo)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* ===================================================
            ADD / EDIT TASK MODAL
            =================================================== */}

        <Modal
          visible={taskEditorVisible}
          transparent
          animationType="slide"
          onRequestClose={closeTaskEditor}
        >
          <View style={styles.editorOverlay}>
            {/* BACKDROP */}

            <Pressable
              style={styles.editorBackdrop}
              onPress={closeTaskEditor}
            />

            {/* MODAL */}

            <View style={styles.editorModal}>
              {/* HEADER */}

              <View style={styles.editorHeader}>
                <View style={styles.editorHeaderText}>
                  <Text style={styles.editorTitle}>
                    {editingTodo ? 'Edit Task' : 'Add Task'}
                  </Text>

                  <Text style={styles.editorSubtitle}>
                    {editingTodo
                      ? 'Update task details'
                      : 'Create a task for the selected date'}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={closeTaskEditor}
                  style={styles.editorCloseButton}
                >
                  <Text style={styles.editorCloseText}>×</Text>
                </TouchableOpacity>
              </View>

              {/* FORM */}

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.editorContent}
              >
                {/* TASK NAME */}

                <Text style={styles.inputLabel}>Task Name</Text>

                <TextInput
                  value={taskName}
                  onChangeText={setTaskName}
                  placeholder="Enter task name"
                  placeholderTextColor="#999999"
                  style={styles.taskInput}
                  returnKeyType="done"
                />

                {/* END DATE */}

                <Text style={styles.inputLabel}>End Date</Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateInput}
                >
                  <Text style={styles.dateInputText}>
                    {formatDateLabel(formatDateLocal(endDate))}
                  </Text>

                  <Text style={styles.calendarEmoji}>📅</Text>
                </TouchableOpacity>

                {/* DATE PICKER */}

                {showDatePicker && (
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="calendar"
                    onChange={(event, selected) => {
                      /*
                       * Android sends a dismissed
                       * event when the user cancels.
                       *
                       * Do not change the current
                       * date in that case.
                       */
                      if (event.type === 'dismissed') {
                        setShowDatePicker(false);
                        return;
                      }

                      if (selected) {
                        setEndDate(selected);
                      }

                      setShowDatePicker(false);
                    }}
                  />
                )}

                {/* BUTTONS */}

                <View style={styles.editorButtons}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={closeTaskEditor}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={saveTask}
                    style={styles.saveButton}
                  >
                    <Text style={styles.saveButtonText}>
                      {editingTodo ? 'Update Task' : 'Add Task'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaScreen>
  );
}

/* ===========================================================
   STYLES
   =========================================================== */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  /* ========================================================
     HEADER
     ======================================================== */

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

  /* ========================================================
     CALENDAR
     ======================================================== */

  calendarWrapper: {
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 4,
  },

  calendar: {
    backgroundColor: '#f7f7f7',
  },

  calendarDay: {
    width: '100%',
    height: 82,
    paddingHorizontal: 2,
    paddingTop: 3,
    paddingBottom: 3,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },

  calendarDaySelected: {
    backgroundColor: '#eef2ff',
    borderRadius: 8,
  },

  dayNumberContainer: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  dayNumberContainerSelected: {
    alignSelf: 'center',
    minWidth: 32,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#120ef8',
    marginBottom: 0,
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

  /*
   * Ring around today's day number so the calendar always "points
   * at" the real current date. The filled pill still wins when the
   * user selects today itself.
   */
  dayNumberContainerToday: {
    alignSelf: 'center',
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#120ef8',
    marginBottom: 0,
  },

  dayNumberToday: {
    color: '#120ef8',
  },

  calendarTaskList: {
    width: '100%',
  },

  calendarTask: {
    width: '100%',
    minHeight: 16,
    borderRadius: 4,
    paddingHorizontal: 3,
    marginBottom: 1,
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
    fontSize: 9,
    fontWeight: '800',
    marginRight: 2,
  },

  calendarTaskText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '500',
  },

  moreTasksContainer: {
    paddingHorizontal: 2,
    marginTop: 1,
  },

  moreTasksText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666666',
    lineHeight: 11,
  },

  /* ========================================================
     SELECTED DATE HEADER
     ======================================================== */

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
    paddingRight: 10,
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

  selectedDateActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    marginRight: 8,
  },

  countBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  addTaskButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: '#120ef8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addTaskButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  /* ========================================================
     TASK SECTION
     ======================================================== */

  taskSection: {
    padding: 16,
  },

  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#eeeeee',
  },

  taskRowCompleted: {
    backgroundColor: '#fafafa',
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#d0a52f',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  checkboxCompleted: {
    backgroundColor: '#4caf6d',
    borderColor: '#4caf6d',
  },

  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  taskTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  taskName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
  },

  taskNameCompleted: {
    color: '#777777',
    textDecorationLine: 'line-through',
  },

  taskStatus: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },

  taskStatusPending: {
    color: '#b8860b',
  },

  taskStatusCompleted: {
    color: '#4caf6d',
  },

  editButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },

  editButtonText: {
    color: '#3346a3',
    fontSize: 12,
    fontWeight: '700',
  },

  deleteButton: {
    minHeight: 34,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: '#fff0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  deleteButtonText: {
    color: '#c62828',
    fontSize: 12,
    fontWeight: '700',
  },

  /* ========================================================
     EMPTY
     ======================================================== */

  empty: {
    alignItems: 'center',
    paddingVertical: 45,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eeeeee',
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#333333',
  },

  emptySubtitle: {
    marginTop: 7,
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },

  emptyAddButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: '#120ef8',
  },

  emptyAddButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* ========================================================
     ADD / EDIT MODAL
     ======================================================== */

  editorOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  editorBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  editorModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: 330,
    paddingBottom: 20,
  },

  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  editorHeaderText: {
    flex: 1,
  },

  editorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },

  editorSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#777777',
  },

  editorCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  editorCloseText: {
    fontSize: 28,
    lineHeight: 30,
    color: '#333333',
  },

  editorContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
    marginTop: 5,
  },

  taskInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#222222',
    backgroundColor: '#fafafa',
  },

  dateInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
  },

  dateInputText: {
    flex: 1,
    fontSize: 15,
    color: '#222222',
  },

  calendarEmoji: {
    fontSize: 20,
    marginLeft: 10,
  },

  editorButtons: {
    flexDirection: 'row',
    marginTop: 25,
  },

  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dddddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555555',
  },

  saveButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#120ef8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },

  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default CalendarScreen;
