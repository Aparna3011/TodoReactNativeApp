import { db } from './database';
import type { NotificationItem } from '../types/notification';

export async function checkStartupNotifications(): Promise<number> {
  try {
    return await db.checkAndTriggerStartupDueNotifications();
  } catch (error) {
    console.error('Failed to check startup due notifications:', error);
    return 0;
  }
}

export async function getNotificationHistory(): Promise<NotificationItem[]> {
  try {
    return await db.getNotifications();
  } catch (error) {
    console.error('Failed to get notification history:', error);
    return [];
  }
}

export async function clearNotificationHistory(): Promise<void> {
  try {
    await db.clearNotifications();
  } catch (error) {
    console.error('Failed to clear notification history:', error);
  }
}

export async function deleteNotificationItem(id: number): Promise<void> {
  try {
    await db.deleteNotification(id);
  } catch (error) {
    console.error('Failed to delete notification item:', error);
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    return await db.getUnreadNotificationCount();
  } catch (error) {
    console.error('Failed to get unread notification count:', error);
    return 0;
  }
}

export async function markAsRead(id: number): Promise<void> {
  try {
    await db.markNotificationAsRead(id);
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
}

export async function markAllAsRead(): Promise<void> {
  try {
    await db.markAllNotificationsAsRead();
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
  }
}

