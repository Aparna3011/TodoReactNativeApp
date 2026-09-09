import React, {useCallback, useState} from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import SafeAreaScreen, {TAB_SCREEN_EDGES} from '../components/SafeAreaScreen';
import {useFocusEffect} from '@react-navigation/native';
import {
  ChartNoAxesColumnIncreasing,
  CircleCheck,
  Clock,
  ListTodo,
} from 'lucide-react-native';

import {getTodos} from '../database/todoRepository';
import type {Todo} from '../types/todo';

function StatsScreen(): React.JSX.Element {
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
  const pendingTasks = todos.filter(todo => todo.completed === 0).length;
  const completedTasks = todos.filter(todo => todo.completed === 1).length;

  return (
    <SafeAreaScreen style={styles.safeArea} edges={TAB_SCREEN_EDGES}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <ChartNoAxesColumnIncreasing size={24} color="#222222" />
          </View>

          <View>
            <Text style={styles.title}>Stats</Text>
            <Text style={styles.subtitle}>Your todo statistics</Text>
          </View>
        </View>

        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <View style={[styles.cardIcon, styles.cardIconTotal]}>
              <ListTodo size={22} color="#4a6edb" />
            </View>
            <Text style={styles.cardValue}>{totalTasks}</Text>
            <Text style={styles.cardLabel}>Total Tasks</Text>
          </View>

          <View style={styles.card}>
            <View style={[styles.cardIcon, styles.cardIconPending]}>
              <Clock size={22} color="#d99a1b" />
            </View>
            <Text style={styles.cardValue}>{pendingTasks}</Text>
            <Text style={styles.cardLabel}>Pending</Text>
          </View>

          <View style={styles.card}>
            <View style={[styles.cardIcon, styles.cardIconCompleted]}>
              <CircleCheck size={22} color="#2e9e4f" />
            </View>
            <Text style={styles.cardValue}>{completedTasks}</Text>
            <Text style={styles.cardLabel}>Completed</Text>
          </View>
        </View>

        {totalTasks > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {Math.round((completedTasks / totalTasks) * 100)}% of your tasks
              are completed.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Stats are derived from your existing tasks.
          </Text>
        </View>
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

  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eeeeee',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 6,
    marginHorizontal: 4,
  },

  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  cardIconTotal: {
    backgroundColor: '#e8edfb',
  },

  cardIconPending: {
    backgroundColor: '#fbf1de',
  },

  cardIconCompleted: {
    backgroundColor: '#e6f5ea',
  },

  cardValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#222222',
  },

  cardLabel: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
  },

  summary: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eeeeee',
    padding: 16,
  },

  summaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
  },

  footer: {
    marginTop: 'auto',
    padding: 20,
  },

  footerText: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
  },
});

export default StatsScreen;