import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react-native';
import SafeAreaScreen, { FULL_SCREEN_EDGES } from '../components/SafeAreaScreen';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NotificationItem } from '../types/notification';
import {
  clearNotificationHistory,
  deleteNotificationItem,
  getNotificationHistory,
  markAllAsRead,
  markAsRead,
} from '../database/notificationRepository';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Notifications'>;

function NotificationsScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotificationHistory();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleItemPress = async (item: NotificationItem) => {
    if (item.is_read === 0) {
      await markAsRead(item.id);
      await loadNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    await loadNotifications();
  };

  const handleClearAll = () => {
    if (notifications.length === 0) {
      return;
    }

    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear your notification history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearNotificationHistory();
            await loadNotifications();
          },
        },
      ],
    );
  };

  const handleDeleteItem = async (id: number) => {
    await deleteNotificationItem(id);
    await loadNotifications();
  };

  const unreadPendingCount = notifications.filter(
    item => item.is_read === 0 && item.is_resolved === 0,
  ).length;

  return (
    <SafeAreaScreen style={styles.safeArea} edges={FULL_SCREEN_EDGES}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color="#111111" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {unreadPendingCount > 0
                ? `${unreadPendingCount} active reminder${
                    unreadPendingCount > 1 ? 's' : ''
                  }`
                : 'All reminders viewed'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {unreadPendingCount > 0 && (
              <TouchableOpacity
                style={styles.markAllButton}
                onPress={handleMarkAllRead}
                accessibilityRole="button"
                accessibilityLabel="Mark all as read"
              >
                <CheckCheck size={16} color="#120ef8" />
              </TouchableOpacity>
            )}

            {notifications.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearAll}
                accessibilityRole="button"
                accessibilityLabel="Clear all notifications"
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notifications List */}
        <FlatList
          data={notifications}
          keyExtractor={item => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#120ef8']}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.emptyListContent,
          ]}
          renderItem={({ item }) => {
            const isResolved = item.is_resolved === 1;
            const isUnread = item.is_read === 0 && !isResolved;

            return (
              <TouchableOpacity
                style={[
                  styles.card,
                  isResolved
                    ? styles.cardResolved
                    : isUnread
                    ? styles.cardUnread
                    : styles.cardRead,
                ]}
                activeOpacity={0.7}
                onPress={() => handleItemPress(item)}
                accessibilityRole="button"
                accessibilityLabel={`${
                  isResolved
                    ? 'Completed notification'
                    : isUnread
                    ? 'Unread notification'
                    : 'Read notification'
                }: ${item.task_name}`}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconBadge,
                      isResolved
                        ? styles.iconBadgeResolved
                        : isUnread
                        ? styles.iconBadgeUnread
                        : styles.iconBadgeRead,
                    ]}
                  >
                    {isResolved ? (
                      <Check size={18} color="#10b981" />
                    ) : (
                      <Bell
                        size={18}
                        color={isUnread ? '#120ef8' : '#888888'}
                      />
                    )}
                  </View>

                  <View style={styles.cardInfo}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.taskName,
                          isResolved
                            ? styles.taskNameResolved
                            : isUnread
                            ? styles.taskNameUnread
                            : styles.taskNameRead,
                        ]}
                        numberOfLines={2}
                      >
                        {item.task_name}
                      </Text>

                      {isResolved ? (
                        <View style={styles.completedBadge}>
                          <CheckCircle2 size={12} color="#10b981" />
                          <Text style={styles.completedBadgeText}>Completed</Text>
                        </View>
                      ) : isUnread ? (
                        <View style={styles.unreadDotBadge}>
                          <Text style={styles.unreadDotText}>NEW</Text>
                        </View>
                      ) : (
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingBadgeText}>Pending</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.metadataRow}>
                      <View style={styles.dateBadge}>
                        <Calendar size={12} color="#b24b00" />
                        <Text style={styles.dateBadgeText}>
                          Due: {item.due_date}
                        </Text>
                      </View>

                      <View style={styles.timeBadge}>
                        <Clock size={12} color="#666666" />
                        <Text style={styles.timeBadgeText}>
                          {item.notified_at}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteItem(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete notification for ${item.task_name}`}
                  >
                    <Trash2 size={16} color="#999999" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <BellOff size={42} color="#999999" />
              </View>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>
                You will see reminders here whenever tasks become due or are pending.
              </Text>
            </View>
          }
        />
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
    backgroundColor: '#f6f7fb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 6,
    borderRadius: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#edeefa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
  },
  cardUnread: {
    borderLeftColor: '#120ef8',
    backgroundColor: '#ffffff',
  },
  cardRead: {
    borderLeftColor: '#93c5fd',
    backgroundColor: '#ffffff',
  },
  cardResolved: {
    borderLeftColor: '#10b981',
    backgroundColor: '#f9fafb',
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBadgeUnread: {
    backgroundColor: '#edeefa',
  },
  iconBadgeRead: {
    backgroundColor: '#f0f9ff',
  },
  iconBadgeResolved: {
    backgroundColor: '#ecfdf5',
  },
  cardInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  taskName: {
    flex: 1,
    fontSize: 15,
    marginRight: 8,
  },
  taskNameUnread: {
    fontWeight: '700',
    color: '#111827',
  },
  taskNameRead: {
    fontWeight: '600',
    color: '#1f2937',
  },
  taskNameResolved: {
    fontWeight: '500',
    color: '#4b5563',
    textDecorationLine: 'line-through',
  },
  unreadDotBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unreadDotText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingBadgeText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '500',
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffedd5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9a3412',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeBadgeText: {
    fontSize: 11,
    color: '#6b7280',
  },
  deleteButton: {
    padding: 6,
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default NotificationsScreen;
