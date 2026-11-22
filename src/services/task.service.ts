import { apiClient } from '@/services/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';
import type { CreateTaskInput, Task, TaskPriority, TaskStatus, UpdateTaskInput } from '@/types/task';

/**
 * Service komunikasi API tugas (Task API).
 */

export interface TaskFilterParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
}

export async function getProjectTasks(
  projectId: string,
  filter?: TaskFilterParams,
): Promise<ApiSuccessResponse<{ tasks: Task[] }>> {
  const response = await apiClient.get<ApiSuccessResponse<{ tasks: Task[] }>>(`/projects/${projectId}/tasks`, {
    params: filter,
  });
  return response.data;
}

export async function getTaskDetail(taskId: string): Promise<ApiSuccessResponse<{ task: Task }>> {
  const response = await apiClient.get<ApiSuccessResponse<{ task: Task }>>(`/tasks/${taskId}`);
  return response.data;
}

export async function createTask(
  projectId: string,
  input: CreateTaskInput,
): Promise<ApiSuccessResponse<{ task: Task }>> {
  const response = await apiClient.post<ApiSuccessResponse<{ task: Task }>>(`/projects/${projectId}/tasks`, input);
  return response.data;
}

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput,
): Promise<ApiSuccessResponse<{ task: Task }>> {
  const response = await apiClient.patch<ApiSuccessResponse<{ task: Task }>>(`/tasks/${taskId}`, input);
  return response.data;
}

export async function deleteTask(taskId: string): Promise<ApiSuccessResponse<null>> {
  const response = await apiClient.delete<ApiSuccessResponse<null>>(`/tasks/${taskId}`);
  return response.data;
}

export const taskService = {
  getProjectTasks,
  getTaskDetail,
  createTask,
  updateTask,
  deleteTask,
};
