import { apiClient } from '@/services/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';
import type { Task } from '@/types/task';

/**
 * Service komunikasi API tugas (/api/v1/projects/:projectId/tasks).
 */

export async function getProjectTasks(projectId: string): Promise<ApiSuccessResponse<{ tasks: Task[] }>> {
  const response = await apiClient.get<ApiSuccessResponse<{ tasks: Task[] }>>(`/projects/${projectId}/tasks`);
  return response.data;
}

export const taskService = {
  getProjectTasks,
};
