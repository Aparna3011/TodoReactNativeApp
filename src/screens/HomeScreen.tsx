import React, { useCallback, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getTodos, toggleTodo, deleteTodo } from '../database/todoRepository';
import type { Todo } from '../types/todo';
import type { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type Filter = 'all' | 'pending' | 'completed';

function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

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

  const filteredTodos = todos.filter(todo => {
    if (filter === 'completed') {
      return todo.completed === 1;
    }

    if (filter === 'pending') {
      return todo.completed === 0;
    }

    return true;
  });

  const handleToggle = async (todo: Todo) => {
    await toggleTodo(todo.id, todo.completed);
    await loadTodos();
  };

  const handleDelete = async (id: number) => {
    await deleteTodo(id);
    await loadTodos();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Tasks</Text>
            <Text style={styles.subtitle}>Keep track of your daily tasks</Text>
          </View>

          <View style={styles.countCircle}>
            <Text style={styles.countText}>{todos.length}</Text>
          </View>
        </View>

        <View style={styles.filters}>
          <FilterButton
            label="All"
            active={filter === 'all'}
            activeColor="#0f49d2"
            onPress={() => setFilter('all')}
          />

          <FilterButton
            label="Pending"
            active={filter === 'pending'}
            activeColor="#d20f0f"
            onPress={() => setFilter('pending')}
          />

          <FilterButton
            label="Completed"
            active={filter === 'completed'}
            activeColor="#196509"
            onPress={() => setFilter('completed')}
          />
        </View>

        <FlatList
          data={filteredTodos}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  item.completed === 1 && styles.checkboxCompleted,
                ]}
                onPress={() => handleToggle(item)}
              >
                {item.completed === 1 && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.taskContent}
                onPress={() =>
                  navigation.navigate('EditTask', {
                    todo: item,
                  })
                }
              >
                <Text
                  style={[
                    styles.taskTitle,
                    item.completed === 1 && styles.completedTask,
                  ]}
                >
                  {item.task_name}
                </Text>

                <Text style={styles.date}>End date: {item.end_date}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No tasks found</Text>

              <Text style={styles.emptySubtitle}>
                Tap + to add your first task.
              </Text>
            </View>
          }
        />

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddTask')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function FilterButton({
  label,
  active,
  activeColor,
  onPress,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterButton, active && { backgroundColor: activeColor }]}
      onPress={onPress}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  countCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ded9e6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  countText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },

  filters: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },

  filterButtonActive: {
    backgroundColor: '#222222',
  },

  filterText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },

  filterTextActive: {
    color: '#ffffff',
  },

  list: {
    padding: 16,
    paddingBottom: 100,
  },

  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eeeeee',
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#999999',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  checkboxCompleted: {
    backgroundColor: '#196509',
    borderColor: '#096509',
  },

  checkmark: {
    color: '#ffffff',
    fontWeight: '700',
  },

  taskContent: {
    flex: 1,
  },

  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },

  completedTask: {
    color: '#0d5e2d',
    textDecorationLine: 'line-through',
  },

  date: {
    marginTop: 5,
    fontSize: 13,
    color: '#777777',
  },

  deleteButton: {
    marginLeft: 10,
    padding: 6,
  },

  deleteText: {
    color: '#d32f2f',
    fontSize: 13,
    fontWeight: '600',
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
  },

  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 25,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },

  addButtonText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '300',
    lineHeight: 38,
  },
});

export default HomeScreen;
