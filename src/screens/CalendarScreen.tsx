import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  ScrollView,
  StatusBar,
  View,
} from 'react-native';
import SafeAreaScreen, { TAB_SCREEN_EDGES } from '../components/SafeAreaScreen';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Calendar } from 'react-native-calendars';

import { getTodos } from '../database/todoRepository';
import type { Todo } from '../types/todo';
import type { RootStackParamList } from '../navigation/AppNavigator';

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
     SELECT DATE / NAVIGATION
     ======================================================= */

  const handleSelectDate = useCallback(
    (date: string) => {
      setSelectedDate(date);

      const tasksForDate = todosByDate[date] ?? [];
      if (tasksForDate.length === 0) {
        navigation.navigate('AddTask', {
          initialDate: date,
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
