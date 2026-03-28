import client from './client';
import type { Task } from '../types';

export async function getTasks(): Promise<Task[]> {
  const response = await client.get<Task[]>('/tasks');
  return response.data;
}

export interface TaskCreateInput {
  title: string;
  skillIds?: number[];
  subtasks?: TaskCreateInput[];
}

export interface CreateTaskResult {
  task: Task;
  geminiWarning?: string;
}

export async function createTask(data: TaskCreateInput): Promise<CreateTaskResult> {
  const response = await client.post<Task & { geminiWarning?: string }>('/tasks', data);
  const { geminiWarning, ...task } = response.data;
  return { task: task as Task, geminiWarning };
}

export async function updateTask(
  id: number,
  data: { assignedDeveloperId?: number | null; status?: string }
): Promise<Task> {
  const response = await client.patch<Task>(`/tasks/${id}`, data);
  return response.data;
}
