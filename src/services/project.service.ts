import { apiClient } from '@/services/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';
import type { CreateProjectInput, Project, ProjectMember } from '@/types/project';

/**
 * Service komunikasi API proyek (/api/v1/projects).
 */

export async function getProjects(): Promise<ApiSuccessResponse<{ projects: Project[] }>> {
  const response = await apiClient.get<ApiSuccessResponse<{ projects: Project[] }>>('/projects');
  return response.data;
}

export async function getProjectDetail(projectId: string): Promise<ApiSuccessResponse<{ project: Project }>> {
  const response = await apiClient.get<ApiSuccessResponse<{ project: Project }>>(`/projects/${projectId}`);
  return response.data;
}

export async function createProject(input: CreateProjectInput): Promise<ApiSuccessResponse<{ project: Project }>> {
  const response = await apiClient.post<ApiSuccessResponse<{ project: Project }>>('/projects', input);
  return response.data;
}

export async function getProjectMembers(projectId: string): Promise<ApiSuccessResponse<{ members: ProjectMember[] }>> {
  const response = await apiClient.get<ApiSuccessResponse<{ members: ProjectMember[] }>>(`/projects/${projectId}/members`);
  return response.data;
}

export const projectService = {
  getProjects,
  getProjectDetail,
  createProject,
  getProjectMembers,
};
