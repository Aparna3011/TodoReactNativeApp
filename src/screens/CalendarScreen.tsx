import React, {useCallback, useMemo, useState} from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {CalendarDays} from 'lucide-react-native';

import {getTodos} from '../database/todoRepository';
import type {Todo} from '../types/todo';

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

function CalendarScreen(): React.JSX.Element {
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

  const groups = useMemo(() => {
    const byDate = new Map<string, Todo[]>();

    [...todos]
      .sort((a, b) => a.end_date.localeCompare(b.end_date))
      .forEach(todo => {
        const list = byDate.get(todo.end_date) ?? [];
        list.push(todo);
        byDate.set(todo.end_date, list);
      });

    return Array.from(byDate.entries()).map(([endDate, tasks]) => ({endDate, tasks}));
  }, [todos]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <CalendarDays size={24} color="#222222" />
          </View>

          <View>
            <Text style={styles.title}>Calendar</Text>
            <Text style={styles.subtitle}>View your tasks by date</Text>
          </View>
        </View>

        <FlatList
          data={groups}
          keyExtractor={item => item.endDate}
          contentContainerStyle={styles.list}
          renderItem={({item}) => (
            <View style={styles.group}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateLabel}>{formatDateLabel(item.endDate)}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{item.tasks.length}</Text>
                </View>
              </View>

              {item.tasks.map(todo => (
                <View key={String(todo.id)} style={styles.taskRow}>
                  <View
                    style={[
                      styles.taskDot,
                      todo.completed === 1 && styles.taskDotCompleted,
                    ]}
                  />
                  <View style={styles.taskTextContainer}>
                    <Text
                      style={[
                        styles.taskName,
                        todo.completed === 1 && styles.taskNameCompleted,
                      ]}
                    >
                      {todo.task_name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.taskStatus,
                      todo.completed === 1
                        ? styles.taskStatusCompleted
                        : styles.taskStatusPending,
                    ]}
                  >
                    {todo.completed === 1 ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              ))}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptySubtitle}>
                Tasks with end dates will be grouped here by date.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 22,
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

  list: {
    padding: 16,
    paddingBottom: 32,
  },

  group: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eeeeee',
    overflow: 'hidden',
  },

  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f1f1f1',
  },

  dateLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
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

  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eeeeee',
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

  empty: {
    alignItems: 'center',
    paddingTop: 100,
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
  },
});

export default CalendarScreen;