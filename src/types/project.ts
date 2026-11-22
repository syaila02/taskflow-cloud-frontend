import type { User } from './auth';

export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  currentUserRole?: ProjectRole;
  _count?: {
    members: number;
    tasks: number;
  };
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  user: User;
}
