import { NativeModules } from 'react-native';
import type { Todo } from '../types/todo';

/**
 * Interface for the native AndroidSQLite module. On Android this opens
 * todo.db through the framework class android.database.sqlite.SQLiteDatabase,
 * which is what Android Studio's Database Inspector attaches to (live).
 */
interface NativeTodoDB {
  initialize(): Promise<void>;
  getTodos(): Promise<Todo[]>;
  addTodo(
    taskName: string,
    endDate: string,
    createdAt: string,
    imagePath: string | null,
  ): Promise<void>;
  updateTodo(
    id: number,
    taskName: string,
    endDate: string,
    imagePath: string | null,
  ): Promise<void>;
  setCompleted(id: number, completed: number): Promise<void>;
  deleteTodo(id: number): Promise<void>;
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
  addTodo: (
    taskName: string,
    endDate: string,
    createdAt: string,
    imagePath: string | null = null,
  ): Promise<void> => nativeDb.addTodo(taskName, endDate, createdAt, imagePath),
  updateTodo: (
    id: number,
    taskName: string,
    endDate: string,
    imagePath: string | null = null,
  ): Promise<void> => nativeDb.updateTodo(id, taskName, endDate, imagePath),
  setCompleted: (id: number, completed: number): Promise<void> =>
    nativeDb.setCompleted(id, completed),
  deleteTodo: (id: number): Promise<void> => nativeDb.deleteTodo(id),
};

/** Opens the database and ensures the schema exists, keeping the connection open. */
export async function initializeDatabase(): Promise<void> {
  await nativeDb.initialize();
}
