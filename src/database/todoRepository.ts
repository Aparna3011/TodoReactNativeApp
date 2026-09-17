import { db } from './database';
import type { Todo } from '../types/todo';

export async function getTodos(): Promise<Todo[]> {
  return db.getTodos();
}

export async function addTodo(
  taskName: string,
  startDate: string,
  endDate: string,
  imagePath: string | null = null,
): Promise<void> {
  await db.addTodo(
    taskName,
    startDate,
    endDate,
    new Date().toISOString(),
    imagePath,
  );
}

export async function updateTodo(
  id: number,
  taskName: string,
  startDate: string,
  endDate: string,
  imagePath: string | null = null,
): Promise<void> {
  await db.updateTodo(id, taskName, startDate, endDate, imagePath);
}

export async function toggleTodo(id: number, completed: number): Promise<void> {
  const newCompleted = completed === 1 ? 0 : 1;

  // The native module computes completed_at based on the new status:
  // completing stamps the current time (unless one was manually set),
  // setting back to pending clears it.
  await db.setCompleted(id, newCompleted);
}

import AndroidCamera from '../native/AndroidCamera';

export async function deleteTodo(id: number): Promise<void> {
  const todos = await db.getTodos();
  const target = todos.find(t => t.id === id);
  await db.deleteTodo(id);
  if (target?.image_path) {
    try {
      await AndroidCamera.deleteImageFile(target.image_path);
    } catch {
      // Ignore cleanup error if file was already removed
    }
  }
}
