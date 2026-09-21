import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, ScrollView, StatusBar, View } from 'react-native';
import SafeAreaScreen, { TAB_SCREEN_EDGES } from '../components/SafeAreaScreen';
import {
  useFocusEffect,
  useNavigation,
  useNavigationState,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Calendar } from 'react-native-calendars';

import { getTodos } from '../database/todoRepository';
import type { Todo } from '../types/todo';
import type { RootStackParamList } from '../navigation/AppNavigator';

import { groupTodosByDate } from '../utils/todoDate';

import CalendarHeader from '../components/calendar/CalendarHeader';
import CalendarDay from '../components/calendar/CalendarDay';
import { styles } from '../components/calendar/calendarStyles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/* =========================================================
   DATE HELPERS
   ========================================================= */
function getTodayDateString(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/* =========================================================
   CALENDAR SCREEN
   ========================================================= */
function CalendarScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();

  const [todos, setTodos] = useState<Todo[]>([]);

  const [selectedDate, setSelectedDate] = useState<string>(
    getTodayDateString(),
  );

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
   * Which month the Calendar should initially display. Set to today's
   * month so the first visit anchors on the current month; reset to today's
   * month whenever the user returns from another bottom tab.
   */
  const [calendarAnchor, setCalendarAnchor] = useState(getTodayDateString());
  const [calendarKey, setCalendarKey] = useState(0);

  /*
   * Tab-switch lifecycle tracking:
   * When the user switches to another bottom tab (Tasks, Stats, Profile),
   * isCalendarTab becomes false and wasInactiveRef is flagged.
   * When returning to the Calendar tab, the selection and visible month
   * reset to today's date.
   * When opening a child screen (AddTask / DateTasks / EditTask) from
   * Calendar, the bottom tab never changes, so the selected date is preserved.
   */
  const wasInactiveRef = useRef(false);

  const isCalendarTab = useNavigationState(state => {
    if (!state || !state.routes || state.index === undefined) {
      return true;
    }
    const currentRoute = state.routes[state.index];
    return currentRoute?.name === 'Calendar';
  });

  useEffect(() => {
    if (!isCalendarTab) {
      wasInactiveRef.current = true;
    } else if (wasInactiveRef.current) {
      wasInactiveRef.current = false;
      const today = getTodayDateString();
      setSelectedDate(today);
      setCalendarAnchor(today);
      setCalendarKey(k => k + 1);
      lastTodayRef.current = today;
    }
  }, [isCalendarTab]);

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
     FOCUS HOOK (REFRESH TASKS ONLY)
     ======================================================= */

  useFocusEffect(
    useCallback(() => {
      /*
       * Refresh the task chips every time this screen gains focus.
       *
       * The selected date and visible month are managed by the tab-switch
       * lifecycle hook above, so returning from a child screen (AddTask /
       * DateTasks / EditTask) preserves the user's chosen date.
       */
      loadTodos();
    }, [loadTodos]),
  );

  /* =======================================================
     LIVE "TODAY" SYNC (BACKGROUND RETURN)
     ======================================================= */

  /*
   * The Calendar tab stays mounted while the app is backgrounded.
   * When the app comes back (possibly on a new day), refresh "today"
   * so the today marker and the selection follow the real current
   * date. A date the user picked manually is never overridden.
   */
  const syncToLiveToday = useCallback(() => {
    const today = getTodayDateString();

    const prevToday = lastTodayRef.current;

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

  // Shared with DateTasksScreen: a todo belongs to a date when that date is
  // its start date or its due date, each todo listed at most once per date.
  const todosByDate = useMemo(() => groupTodosByDate(todos), [todos]);

  /* =======================================================
     CALENDAR MARKED DATES
     ======================================================= */

  const markedDates = useMemo(() => {
    const marked: Record<string, { marked?: boolean; selected?: boolean }> = {};

    // Dots come from the same date keys that render task chips, so a dot can
    // never mark a day the calendar would not show a task for.
    Object.keys(todosByDate).forEach(dateKey => {
      marked[dateKey] = {
        marked: true,
      };
    });

    marked[selectedDate] = {
      ...(marked[selectedDate] ?? {}),
      selected: true,
    };

    return marked;
  }, [todosByDate, selectedDate]);

  /* =======================================================
     SELECT DATE / NAVIGATION
     ======================================================= */

  const handleSelectDate = useCallback(
    (date: string) => {
      setSelectedDate(date);

      const tasksForDate = todosByDate[date] ?? [];
      if (tasksForDate.length === 0) {
        navigation.navigate('AddTask', {
          initialStartDate: date,
          initialEndDate: date,
        });
      } else {
        navigation.navigate('DateTasks', {
          date,
        });
      }
    },
    [todosByDate, navigation],
  );

  const handleTaskPress = useCallback(
    (todo: Todo) => {
      navigation.navigate('EditTask', {
        todo,
      });
    },
    [navigation],
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
          onTaskPress={handleTaskPress}
        />
      );
    },
    [todosByDate, selectedDate, handleSelectDate, handleTaskPress],
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
          <CalendarHeader />

          {/* =================================================
              CALENDAR
              ================================================= */}

          <View style={styles.calendarWrapper}>
            <Calendar
              key={`calendar-${calendarKey}`}
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
        </ScrollView>
      </View>
    </SafeAreaScreen>
  );
}

export default CalendarScreen;
