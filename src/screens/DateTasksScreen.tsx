import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft, Plus } from 'lucide-react-native';
import SafeAreaScreen, {
  FULL_SCREEN_EDGES,
} from '../components/SafeAreaScreen';
import TaskImage from '../components/TaskImage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { deleteTodo, getTodos, toggleTodo } from '../database/todoRepository';
import type { Todo } from '../types/todo';
import type { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DateTasks'>;
type DateTasksRouteProp = RouteProp<RootStackParamList, 'DateTasks'>;

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

function DateTasksScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DateTasksRouteProp>();
  const { date } = route.params;

  const [todos, setTodos] = useState<Todo[]>([]);

  const loadDateTodos = useCallback(async () => {
    try {
      const allTodos = await getTodos();
      const dateFiltered = allTodos.filter(t => t.end_date === date);
      setTodos(dateFiltered);
    } catch (error) {
      console.error('Failed to load todos for date:', error);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      loadDateTodos();
    }, [loadDateTodos]),
  );

  const handleToggle = async (todo: Todo) => {
    try {
      await toggleTodo(todo.id, todo.completed);
      await loadDateTodos();
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleDelete = (todo: Todo) => {
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
            await loadDateTodos();
          } catch (error) {
            console.error('Failed to delete task:', error);
            Alert.alert('Error', 'Unable to delete task.');
          }
        },
      },
    ]);
  };

  const handleAddTask = () => {
    navigation.navigate('AddTask', {
      initialDate: date,
    });
  };

  const handleEditTask = (todo: Todo) => {
    navigation.navigate('EditTask', {
      todo,
    });
  };

  return (
    <SafeAreaScreen style={styles.safeArea} edges={FULL_SCREEN_EDGES}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={24} color="#222222" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>{formatDateLabel(date)}</Text>
          <Text style={styles.subtitle}>
            {todos.length === 0
              ? 'No tasks scheduled'
              : `${todos.length} ${todos.length === 1 ? 'task' : 'tasks'} scheduled`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerAddButton}
          onPress={handleAddTask}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#ffffff" />
          <Text style={styles.headerAddText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* TASK LIST */}
      <FlatList
        data={todos}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const completed = item.completed === 1;

          return (
            <View
              style={[
                styles.taskCard,
                completed && styles.taskCardCompleted,
              ]}
            >
              {/* CHECKBOX */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleToggle(item)}
                style={[
                  styles.checkbox,
                  completed && styles.checkboxCompleted,
                ]}
              >
                {completed && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>

              {/* TASK CONTENT */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleEditTask(item)}
                style={styles.taskContent}
              >
                <Text
                  numberOfLines={2}
                  style={[
                    styles.taskName,
                    completed && styles.taskNameCompleted,
                  ]}
                >
                  {item.task_name}
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
              </TouchableOpacity>

              {/* TASK IMAGE */}
              <TaskImage
                imagePath={item.image_path}
                style={styles.taskThumbnail}
              />

              {/* EDIT BUTTON */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleEditTask(item)}
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>

              {/* DELETE BUTTON */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleDelete(item)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptySubtitle}>
              There are no tasks scheduled for this date.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAddTask}
              style={styles.emptyAddButton}
            >
              <Text style={styles.emptyAddButtonText}>+ Add Task</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  backButton: {
    padding: 6,
    marginRight: 10,
  },

  headerInfo: {
    flex: 1,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },

  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#777777',
  },

  headerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#120ef8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  headerAddText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },

  listContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },

  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  taskCardCompleted: {
    backgroundColor: '#fafafa',
    borderColor: '#e0e0e0',
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
    borderColor: '#196509',
  },

  checkmark: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  taskContent: {
    flex: 1,
    marginRight: 8,
  },

  taskName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
  },

  taskNameCompleted: {
    color: '#888888',
    textDecorationLine: 'line-through',
  },

  taskStatus: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },

  taskStatusCompleted: {
    color: '#196509',
  },

  taskStatusPending: {
    color: '#d20f0f',
  },

  taskThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
  },

  editButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginRight: 6,
  },

  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },

  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d32f2f',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#777777',
    marginTop: 6,
    marginBottom: 20,
    textAlign: 'center',
  },

  emptyAddButton: {
    backgroundColor: '#120ef8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  emptyAddButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default DateTasksScreen;
