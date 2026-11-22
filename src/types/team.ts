import type { User } from './auth';
import type { ProjectRole } from './project';

export interface TeamMember {
  id: string; // memberId
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  user: User;
  projectName?: string;
  projectOwnerId?: string;
  currentUserRoleInProject?: ProjectRole;
}

export interface Invitation {
  id: string;
  projectId: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

export interface CreateInvitationInput {
  email: string;
  role?: 'ADMIN' | 'MEMBER';
}

export interface UpdateMemberRoleInput {
  role: 'ADMIN' | 'MEMBER';
}

export interface AcceptInvitationInput {
  token: string;
}
