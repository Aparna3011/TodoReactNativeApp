import {db} from './database';
import type {Todo} from '../types/todo';

export async function getTodos(): Promise<Todo[]> {
  return db.getTodos();
}

export async function addTodo(
  taskName: string,
  endDate: string,
): Promise<void> {
  await db.addTodo(
    taskName,
    endDate,
    new Date().toISOString(),
  );
}

export async function updateTodo(
  id: number,
  taskName: string,
  endDate: string,
): Promise<void> {
  await db.updateTodo(id, taskName, endDate);
}

export async function toggleTodo(
  id: number,
  completed: number,
): Promise<void> {
  await db.setCompleted(id, completed === 1 ? 0 : 1);
}

export async function deleteTodo(
  id: number,
): Promise<void> {
  await db.deleteTodo(id);
}
