import React, {useCallback, useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {CircleCheck, Clock, ListTodo, UserRound} from 'lucide-react-native';

import {getTodos} from '../database/todoRepository';
import type {Todo} from '../types/todo';

type StatRow = {
  label: string;
  value: number;
  Icon: React.ComponentType<{size?: number; color?: string}>;
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
  const pendingTasks = todos.filter(todo => todo.completed === 0).length;

  const rows: StatRow[] = [
    {
      label: 'Total Tasks',
      value: totalTasks,
      Icon: ListTodo,
      iconColor: '#4a6edb',
      iconBackground: '#e8edfb',
    },
    {
      label: 'Completed Tasks',
      value: completedTasks,
      Icon: CircleCheck,
      iconColor: '#2e9e4f',
      iconBackground: '#e6f5ea',
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks,
      Icon: Clock,
      iconColor: '#d99a1b',
      iconBackground: '#fbf1de',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <UserRound size={42} color="#222222" />
          </View>

          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Your task overview</Text>
        </View>

        <Text style={styles.sectionTitle}>Task Management</Text>

        <View style={styles.card}>
          {rows.map((row, index) => {
            const RowIcon = row.Icon;

            return (
              <View
                key={row.label}
                style={[
                  styles.row,
                  index < rows.length - 1 && styles.rowBorder,
                ]}
              >
                <View
                  style={[
                    styles.rowIcon,
                    {backgroundColor: row.iconBackground},
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Statistics are derived from your existing tasks.
          </Text>
        </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 22,
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

export default ProfileScreen;