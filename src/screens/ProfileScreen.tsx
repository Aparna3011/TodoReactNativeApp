import React, { useCallback, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import SafeAreaScreen, { TAB_SCREEN_EDGES } from '../components/SafeAreaScreen';
import { useFocusEffect } from '@react-navigation/native';
import {
  AppWindow,
  CalendarClock,
  CircleCheck,
  Gauge,
  Hourglass,
  Info,
  TriangleAlert,
  UserRound,
} from 'lucide-react-native';

import appInfo from '../../app.json';
import packageInfo from '../../package.json';
import { getTodos } from '../database/todoRepository';
import type { Todo } from '../types/todo';
import { getTodoStatus } from '../utils/todoDate';

/** App identity shown in the About card (kept in sync with app.json / package.json). */
const APP_NAME = appInfo.displayName;
const APP_VERSION = packageInfo.version;

type StatusRow = {
  label: string;
  value: number;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  iconColor: string;
  iconBackground: string;
};

function ProfileScreen(): React.JSX.Element {
  const [todos, setTodos] = useState<Todo[]>([]);

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

  const totalTasks = todos.length;
  const completedTasks = todos.filter(todo => todo.completed === 1).length;

  // Status counts are derived in a single pass over the loaded tasks using the
  // same getTodoStatus rule the Tasks/Calendar screens rely on, so this
  // breakdown can never disagree with the rest of the app. Completed tasks are
  // counted above, and a task falls into exactly one of the remaining states.
  let dueToday = 0;
  let overdue = 0;
  let upcoming = 0;

  todos.forEach(todo => {
    const status = getTodoStatus(todo);
    if (status === 'DUE TODAY') {
      dueToday += 1;
    } else if (status === 'OVERDUE') {
      overdue += 1;
    } else if (status === 'UPCOMING') {
      upcoming += 1;
    }
  });

  const completionPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statusRows: StatusRow[] = [
    {
      label: 'Completed',
      value: completedTasks,
      Icon: CircleCheck,
      iconColor: '#2e9e4f',
      iconBackground: '#e6f5ea',
    },
    {
      label: 'Due Today',
      value: dueToday,
      Icon: CalendarClock,
      iconColor: '#1d4ed8',
      iconBackground: '#eff6ff',
    },
    {
      label: 'Overdue',
      value: overdue,
      Icon: TriangleAlert,
      iconColor: '#dc2626',
      iconBackground: '#fef2f2',
    },
    {
      label: 'Upcoming',
      value: upcoming,
      Icon: Hourglass,
      iconColor: '#4b5563',
      iconBackground: '#f3f4f6',
    },
  ];

  return (
    <SafeAreaScreen style={styles.safeArea} edges={TAB_SCREEN_EDGES}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <UserRound size={44} color="#222222" />
          </View>

          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Your personal task overview</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* <Text style={styles.sectionTitle}>Overview</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.rowIcon, styles.rowIconAccent]}>
                <Gauge size={22} color="#4a6edb" />
              </View>

              <Text style={styles.rowLabel}>Completion Rate</Text>

              <Text style={styles.rowValue}>{completionPercent}%</Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${completionPercent}%` }]}
              />
            </View>

            <Text style={styles.progressCaption}>
              {totalTasks > 0
                ? `${completedTasks} of ${totalTasks} tasks completed`
                : 'No tasks yet — add your first task to get started.'}
            </Text>
          </View> */}

          <Text style={styles.sectionTitle}>Task Status</Text>

          <View style={styles.card}>
            {statusRows.map((row, index) => {
              const RowIcon = row.Icon;

              return (
                <View
                  key={row.label}
                  style={[
                    styles.row,
                    index < statusRows.length - 1 && styles.rowBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.rowIcon,
                      { backgroundColor: row.iconBackground },
                    ]}
                  >
                    <RowIcon size={22} color={row.iconColor} />
                  </View>

                  <Text style={styles.rowLabel}>{row.label}</Text>

                  <Text style={styles.rowValue}>{row.value}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.rowIcon, styles.rowIconAccent]}>
                <AppWindow size={22} color="#4a6edb" />
              </View>

              <Text style={styles.rowLabel}>App</Text>

              <Text style={styles.rowValueText}>{APP_NAME}</Text>
            </View>

            <View style={[styles.row, styles.rowBorder]}>
              <View style={[styles.rowIcon, styles.rowIconAccent]}>
                <Info size={22} color="#4a6edb" />
              </View>

              <Text style={styles.rowLabel}>Version</Text>

              <Text style={styles.rowValueText}>{APP_VERSION}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Your task data stays on this device.
            </Text>
          </View>
        </ScrollView>
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

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#ece8f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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

  sectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#555555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  card: {
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eeeeee',
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eeeeee',
  },

  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  rowIconAccent: {
    backgroundColor: '#e8edfb',
  },

  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
  },

  rowValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },

  rowValueText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },

  progressTrack: {
    marginTop: 16,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#eeeeee',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#2e9e4f',
  },

  progressCaption: {
    marginTop: 8,
    fontSize: 13,
    color: '#666666',
  },

  footer: {
    marginTop: 30,
    padding: 20,
  },

  footerText: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
  },
});

export default ProfileScreen;
