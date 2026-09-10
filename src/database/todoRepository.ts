import {db} from './database';
import type {Todo} from '../types/todo';

export async function getTodos(): Promise<Todo[]> {
  return db.getTodos();
}

export async function addTodo(
  taskName: string,
  endDate: string,
  imagePath: string | null = null,
): Promise<void> {
  await db.addTodo(
    taskName,
    endDate,
    new Date().toISOString(),
    imagePath,
  );
}

export async function updateTodo(
  id: number,
  taskName: string,
  endDate: string,
  imagePath: string | null = null,
): Promise<void> {
  await db.updateTodo(id, taskName, endDate, imagePath);
}

export async function toggleTodo(
  id: number,
  completed: number,
): Promise<void> {
  await db.setCompleted(id, completed === 1 ? 0 : 1);
}

import AndroidCamera from '../native/AndroidCamera';

export async function deleteTodo(
  id: number,
): Promise<void> {
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
