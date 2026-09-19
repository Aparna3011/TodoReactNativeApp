import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import SafeAreaScreen, { TAB_SCREEN_EDGES } from '../components/SafeAreaScreen';
import TaskImage from '../components/TaskImage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, Search, X } from 'lucide-react-native';

import { getTodos, toggleTodo, deleteTodo } from '../database/todoRepository';
import { getUnreadCount } from '../database/notificationRepository';
import { getLocalTodayDateString, getTodoStatus } from '../utils/todoDate';
import type { Todo } from '../types/todo';
import type { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type Filter = 'all' | 'pending' | 'completed';

// Ordinary UI spacing constants (NOT safe-area values). The actual device
// insets are applied at runtime by SafeAreaScreen / the bottom tab bar.
const FAB_HEIGHT = 58;
const FAB_CLEARANCE = 16;
const FAB_RIGHT_MARGIN = 20;
const LIST_BOTTOM_GAP = 26;

/**
 * Vertical space reserved at the bottom of the scrollable list so the very
 * last task card can be fully scrolled above the floating action button.
 *
 * Derived from the FAB geometry (which itself floats above the tab bar),
 * instead of a magic number:
 *   FAB height + FAB's clearance above the tab bar + an extra gap.
 */
const LIST_BOTTOM_PADDING = FAB_HEIGHT + FAB_CLEARANCE + LIST_BOTTOM_GAP;

function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const loadData = useCallback(async () => {
    try {
      const [todosData, unread] = await Promise.all([
        getTodos(),
        getUnreadCount(),
      ]);
      setTodos(todosData);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Matches the task name (case-insensitive) against the search text. The search
  // is combined with the active status filter so the list always shows only the
  // tasks that match BOTH conditions.
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredTodos = todos.filter(todo => {
    if (filter === 'completed' && todo.completed !== 1) {
      return false;
    }

    if (filter === 'pending' && todo.completed !== 0) {
      return false;
    }

    if (
      normalizedQuery !== '' &&
      !todo.task_name.toLowerCase().includes(normalizedQuery)
    ) {
      return false;
    }

    return true;
  });

  const handleToggle = async (todo: Todo) => {
    try {
      await toggleTodo(todo.id, todo.completed);
      await loadData();
    } catch (error) {
      console.error('Failed to update task:', error);
      Alert.alert('Error', 'Unable to update the task.');
    }
  };

  const handleDelete = (todo: Todo) => {
    Alert.alert('Delete Task', `Delete "${todo.task_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTodo(todo.id);
            await loadData();
          } catch (error) {
            console.error('Failed to delete task:', error);
            Alert.alert('Error', 'Unable to delete the task.');
          }
        },
      },
    ]);
  };

  // The tab screen's container ends exactly at the top edge of the tab bar.
  // The FAB is positioned with FAB_CLEARANCE (16dp) above the top edge of
  // the tab bar, remaining completely above both the tab bar and Android
  // system navigation.
  const fabBottom = FAB_CLEARANCE;

  /*
   * Header + filters scroll with the list so the full screen height is
   * available for task cards on small devices. The header is placed inside
   * the FlatList via ListHeaderComponent instead of being fixed above it.
   */
  const listHeader = (
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>My Tasks</Text>
          <Text style={styles.subtitle}>Keep track of your daily tasks</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityRole="button"
            accessibilityLabel={`View Notifications${
              unreadCount > 0 ? `, ${unreadCount} unread` : ''
            }`}
          >
            <Bell size={20} color="#333333" />
            {unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.countCircle}>
            <Text style={styles.countText}>{filteredTodos.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Search
          size={18}
          color="#888888"
          style={styles.searchIcon}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search tasks by name"
          placeholderTextColor="#999999"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search tasks"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <X size={18} color="#888888" />
          </TouchableOpacity>
        )}
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
    </>
  );

  const localToday = getLocalTodayDateString();

  return (
    <SafeAreaScreen style={styles.safeArea} edges={TAB_SCREEN_EDGES}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <FlatList
          data={filteredTodos}
          keyExtractor={item => String(item.id)}
          ListHeaderComponent={listHeader}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: LIST_BOTTOM_PADDING },
          ]}
          renderItem={({ item }) => {
            const completed = item.completed === 1;
            const status = getTodoStatus(item, localToday);

            return (
              <View style={styles.taskCard}>
                {/* TOP ROW: checkbox + task name + image thumbnail */}
                <View style={styles.taskCardTopRow}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      completed && styles.checkboxCompleted,
                    ]}
                    onPress={() => handleToggle(item)}
                  >
                    {completed && <Text style={styles.checkmark}>✓</Text>}
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
                      numberOfLines={2}
                      style={[
                        styles.taskTitle,
                        completed && styles.completedTask,
                      ]}
                    >
                      {item.task_name}
                    </Text>
                  </TouchableOpacity>

                  <TaskImage
                    imagePath={item.image_path}
                    style={styles.taskThumbnail}
                    placeholderIconSize={18}
                  />
                </View>

                {/* BOTTOM ROW: dates + status badge + delete */}
                <View style={styles.taskCardBottomRow}>
                  <View style={styles.taskCardBottomLeft}>
                    <View
                      style={[
                        styles.statusBadge,
                        status === 'COMPLETED'
                          ? styles.statusBadgeCompleted
                          : status === 'OVERDUE'
                          ? styles.statusBadgeOverdue
                          : status === 'DUE TODAY'
                          ? styles.statusBadgeDueToday
                          : styles.statusBadgeUpcoming,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          status === 'COMPLETED'
                            ? styles.statusTextCompleted
                            : status === 'OVERDUE'
                            ? styles.statusTextOverdue
                            : status === 'DUE TODAY'
                            ? styles.statusTextDueToday
                            : styles.statusTextUpcoming,
                        ]}
                      >
                        {status}
                      </Text>
                    </View>

                    <Text style={styles.date} numberOfLines={1}>
                      Start: {item.start_date} · Due: {item.end_date}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item)}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {todos.length === 0 ? 'No tasks found' : 'No matching tasks'}
              </Text>

              <Text style={styles.emptySubtitle}>
                {todos.length === 0
                  ? 'Tap + to add your first task.'
                  : normalizedQuery !== ''
                  ? 'Try a different search term.'
                  : 'Try a different filter.'}
              </Text>
            </View>
          }
        />

        <TouchableOpacity
          style={[styles.addButton, { bottom: fabBottom }]}
          onPress={() => navigation.navigate('AddTask')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaScreen>
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

  headerLeft: {
    flex: 1,
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

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },

  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
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

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    marginHorizontal: 20,
    marginBottom: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f1f3f5',
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222222',
    paddingVertical: 0,
  },

  clearButton: {
    padding: 4,
    marginLeft: 4,
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

  filterText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },

  filterTextActive: {
    color: '#ffffff',
  },

  listContent: {
    flexGrow: 1,
  },

  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#eeeeee',
  },

  taskCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  taskCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingLeft: 36,
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
    marginRight: 10,
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

  taskCardBottomLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginRight: 8,
  },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },

  statusBadgeCompleted: {
    backgroundColor: '#e8f5e9',
  },

  statusBadgeOverdue: {
    backgroundColor: '#fef2f2',
  },

  statusBadgeDueToday: {
    backgroundColor: '#eff6ff',
  },

  statusBadgeUpcoming: {
    backgroundColor: '#f3f4f6',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  statusTextCompleted: {
    color: '#1b5e20',
  },

  statusTextOverdue: {
    color: '#dc2626',
  },

  statusTextDueToday: {
    color: '#1d4ed8',
  },

  statusTextUpcoming: {
    color: '#4b5563',
  },

  date: {
    fontSize: 13,
    color: '#777777',
  },

  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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

  taskThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },

  addButton: {
    position: 'absolute',
    right: FAB_RIGHT_MARGIN,
    width: FAB_HEIGHT,
    height: FAB_HEIGHT,
    borderRadius: FAB_HEIGHT / 2,
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
