import { apiClient } from '@/services/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';
import type {
  AcceptInvitationInput,
  CreateInvitationInput,
  Invitation,
  TeamMember,
  UpdateMemberRoleInput,
} from '@/types/team';

/**
 * Service komunikasi API tim & anggota (/api/v1/projects/:projectId/members & /api/v1/invitations).
 */

export async function getProjectMembers(
  projectId: string,
): Promise<ApiSuccessResponse<{ members: TeamMember[] }>> {
  const response = await apiClient.get<ApiSuccessResponse<{ members: TeamMember[] }>>(
    `/projects/${projectId}/members`,
  );
  return response.data;
}

export async function createInvitation(
  projectId: string,
  input: CreateInvitationInput,
): Promise<ApiSuccessResponse<{ invitation: Invitation }>> {
  const response = await apiClient.post<ApiSuccessResponse<{ invitation: Invitation }>>(
    `/projects/${projectId}/invitations`,
    input,
  );
  return response.data;
}

export async function updateMemberRole(
  projectId: string,
  memberId: string,
  input: UpdateMemberRoleInput,
): Promise<ApiSuccessResponse<{ member: TeamMember }>> {
  const response = await apiClient.patch<ApiSuccessResponse<{ member: TeamMember }>>(
    `/projects/${projectId}/members/${memberId}`,
    input,
  );
  return response.data;
}

export async function removeMember(
  projectId: string,
  memberId: string,
): Promise<ApiSuccessResponse<null>> {
  const response = await apiClient.delete<ApiSuccessResponse<null>>(
    `/projects/${projectId}/members/${memberId}`,
  );
  return response.data;
}

export async function acceptInvitation(
  input: AcceptInvitationInput,
): Promise<ApiSuccessResponse<{ membership: TeamMember }>> {
  const response = await apiClient.post<ApiSuccessResponse<{ membership: TeamMember }>>(
    '/invitations/accept',
    input,
  );
  return response.data;
}

export const teamService = {
  getProjectMembers,
  createInvitation,
  updateMemberRole,
  removeMember,
  acceptInvitation,
};
