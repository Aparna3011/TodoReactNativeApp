import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  ScrollView,
  StatusBar,
  View,
} from 'react-native';
import SafeAreaScreen, { TAB_SCREEN_EDGES } from '../components/SafeAreaScreen';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';

import {
  addTodo,
  deleteTodo,
  getTodos,
  toggleTodo,
  updateTodo,
} from '../database/todoRepository';

import type { Todo } from '../types/todo';

import CalendarHeader from '../components/calendar/CalendarHeader';
import CalendarDay from '../components/calendar/CalendarDay';
import SelectedDateTasks from '../components/calendar/SelectedDateTasks';
import TaskEditorModal from '../components/calendar/TaskEditorModal';
import { styles } from '../components/calendar/calendarStyles';

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

      return (
        <CalendarDay
          date={date}
          state={state}
          todos={todosByDate[date.dateString] ?? []}
          isSelected={date.dateString === selectedDate}
          isToday={date.dateString === getTodayDateString()}
          onSelectDate={handleSelectDate}
          onTaskPress={openEditTask}
        />
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

          <CalendarHeader />

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
              SELECTED DATE HEADER + TASKS
              ================================================= */}

          <SelectedDateTasks
            dateLabel={formatDateLabel(selectedDate)}
            todos={selectedTodos}
            onAddTask={openAddTask}
            onToggle={handleToggle}
            onEdit={openEditTask}
            onDelete={handleDelete}
          />
        </ScrollView>

        {/* ===================================================
            ADD / EDIT TASK MODAL
            =================================================== */}

        <TaskEditorModal
          visible={taskEditorVisible}
          editingTodo={editingTodo}
          taskName={taskName}
          onTaskNameChange={setTaskName}
          endDate={endDate}
          endDateLabel={formatDateLabel(formatDateLocal(endDate))}
          onEndDateChange={setEndDate}
          showDatePicker={showDatePicker}
          onShowDatePickerChange={setShowDatePicker}
          onRequestClose={closeTaskEditor}
          onSave={saveTask}
        />
      </View>
    </SafeAreaScreen>
  );
}

export default CalendarScreen;
