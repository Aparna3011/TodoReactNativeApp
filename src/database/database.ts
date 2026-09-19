import { NativeModules } from 'react-native';
import type { Todo } from '../types/todo';
import type { NotificationItem } from '../types/notification';

/**
 * Interface for the native AndroidSQLite module. On Android this opens
 * todo.db through the framework class android.database.sqlite.SQLiteDatabase,
 * which is what Android Studio's Database Inspector attaches to (live).
 */
interface NativeTodoDB {
  initialize(): Promise<void>;
  getTodos(): Promise<Todo[]>;
  getTodoById(id: number): Promise<Todo | null>;
  addTodo(
    taskName: string,
    startDate: string,
    endDate: string,
    createdAt: string,
    imagePath: string | null,
  ): Promise<void>;
  updateTodo(
    id: number,
    taskName: string,
    startDate: string,
    endDate: string,
    imagePath: string | null,
  ): Promise<void>;
  setCompleted(id: number, completed: number): Promise<void>;
  deleteTodo(id: number): Promise<void>;
  checkAndTriggerStartupDueNotifications(): Promise<number>;
  getNotifications(): Promise<NotificationItem[]>;
  getUnreadNotificationCount(): Promise<number>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(): Promise<void>;
  clearNotifications(): Promise<void>;
  deleteNotification(id: number): Promise<void>;
}

const rawNativeDb = NativeModules.AndroidSQLite as NativeTodoDB | undefined;

if (!rawNativeDb) {
  throw new Error(
    'AndroidSQLite native module was not found. Rebuild the Android app.',
  );
}

const nativeDb: NativeTodoDB = rawNativeDb;

export const db = {
  getTodos: (): Promise<Todo[]> => nativeDb.getTodos(),
  getTodoById: (id: number): Promise<Todo | null> => nativeDb.getTodoById(id),
  addTodo: (
    taskName: string,
    startDate: string,
    endDate: string,
    createdAt: string,
    imagePath: string | null = null,
  ): Promise<void> =>
    nativeDb.addTodo(taskName, startDate, endDate, createdAt, imagePath),
  updateTodo: (
    id: number,
    taskName: string,
    startDate: string,
    endDate: string,
    imagePath: string | null = null,
  ): Promise<void> =>
    nativeDb.updateTodo(id, taskName, startDate, endDate, imagePath),
  setCompleted: (id: number, completed: number): Promise<void> =>
    nativeDb.setCompleted(id, completed),
  deleteTodo: (id: number): Promise<void> => nativeDb.deleteTodo(id),
  checkAndTriggerStartupDueNotifications: (): Promise<number> =>
    nativeDb.checkAndTriggerStartupDueNotifications(),
  getNotifications: (): Promise<NotificationItem[]> =>
    nativeDb.getNotifications(),
  getUnreadNotificationCount: (): Promise<number> =>
    nativeDb.getUnreadNotificationCount(),
  markNotificationAsRead: (id: number): Promise<void> =>
    nativeDb.markNotificationAsRead(id),
  markAllNotificationsAsRead: (): Promise<void> =>
    nativeDb.markAllNotificationsAsRead(),
  clearNotifications: (): Promise<void> => nativeDb.clearNotifications(),
  deleteNotification: (id: number): Promise<void> =>
    nativeDb.deleteNotification(id),
};

/** Opens the database and ensures the schema exists, keeping the connection open. */
export async function initializeDatabase(): Promise<void> {
  await nativeDb.initialize();
}
