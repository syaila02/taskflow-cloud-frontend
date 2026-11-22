import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  User,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  RefreshCw,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { projectService } from '@/services/project.service';
import { teamService } from '@/services/team.service';
import type { Project, ProjectRole } from '@/types/project';
import type { Invitation, TeamMember } from '@/types/team';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

// Role configuration
const ROLE_CONFIG: Record<
  ProjectRole,
  { label: string; badge: 'primary' | 'success' | 'neutral'; icon: React.ElementType; desc: string }
> = {
  OWNER: {
    label: 'Owner',
    badge: 'primary',
    icon: ShieldCheck,
    desc: 'Kendali penuh terhadap seluruh proyek, tugas, dan anggota.',
  },
  ADMIN: {
    label: 'Admin',
    badge: 'success',
    icon: Shield,
    desc: 'Dapat mengelola proyek, tugas, dan mengundang anggota.',
  },
  MEMBER: {
    label: 'Member',
    badge: 'neutral',
    icon: User,
    desc: 'Dapat melihat proyek dan memperbarui status tugas yang ditugaskan.',
  },
};

export const TeamPage: React.FC = () => {
  const { user } = useAuth();

  // State data
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State: Invite Member
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteProjectId, setInviteProjectId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [generatedInvitation, setGeneratedInvitation] = useState<Invitation | null>(null);
  const [hasCopiedToken, setHasCopiedToken] = useState(false);

  // Modal State: Accept Invitation (Join project)
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [acceptToken, setAcceptToken] = useState('');
  const [isSubmittingAccept, setIsSubmittingAccept] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Modal State: Edit Role
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newRole, setNewRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Modal State: Remove Member / Leave
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [isSubmittingRemove, setIsSubmittingRemove] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Feedback Notification Toast
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Fetch all projects and team members
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projRes = await projectService.getProjects();
      const projectList = projRes.data?.projects || [];
      setProjects(projectList);

      if (projectList.length === 0) {
        setMembers([]);
        setIsLoading(false);
        return;
      }

      // Concurrently ambil seluruh members per proyek
      const membersPromises = projectList.map(async (project) => {
        try {
          const res = await teamService.getProjectMembers(project.id);
          const projectMembers = res.data?.members || [];
          return projectMembers.map((m) => ({
            ...m,
            projectName: project.name,
            projectOwnerId: project.ownerId,
            currentUserRoleInProject: project.currentUserRole,
          }));
        } catch {
          return [];
        }
      });

      const aggregatedResults = await Promise.all(membersPromises);
      setMembers(aggregatedResults.flat());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar anggota tim';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Selected project details
  const activeProject = useMemo(() => {
    if (selectedProjectId === 'ALL') return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Check if current user can invite in the active project
  const canInvite = useMemo(() => {
    if (activeProject) {
      return activeProject.currentUserRole === 'OWNER' || activeProject.currentUserRole === 'ADMIN';
    }
    // In ALL projects mode, can invite if user is OWNER/ADMIN in at least one project
    return projects.some((p) => p.currentUserRole === 'OWNER' || p.currentUserRole === 'ADMIN');
  }, [activeProject, projects]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Project filter
      if (selectedProjectId !== 'ALL' && member.projectId !== selectedProjectId) {
        return false;
      }

      // Role filter
      if (selectedRole !== 'ALL' && member.role !== selectedRole) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = member.user.name.toLowerCase().includes(q);
        const matchEmail = member.user.email.toLowerCase().includes(q);
        const matchProj = member.projectName?.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchEmail && !matchProj) return false;
      }

      return true;
    });
  }, [members, selectedProjectId, selectedRole, searchQuery]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = filteredMembers.length;
    const owners = filteredMembers.filter((m) => m.role === 'OWNER').length;
    const admins = filteredMembers.filter((m) => m.role === 'ADMIN').length;
    const regularMembers = filteredMembers.filter((m) => m.role === 'MEMBER').length;
    return { total, owners, admins, regularMembers };
  }, [filteredMembers]);

  // Open Invite Modal
  const handleOpenInvite = () => {
    const defaultProj =
      activeProject && (activeProject.currentUserRole === 'OWNER' || activeProject.currentUserRole === 'ADMIN')
        ? activeProject.id
        : projects.find((p) => p.currentUserRole === 'OWNER' || p.currentUserRole === 'ADMIN')?.id || '';

    setInviteProjectId(defaultProj);
    setInviteEmail('');
    setInviteRole('MEMBER');
    setInviteError(null);
    setGeneratedInvitation(null);
    setHasCopiedToken(false);
    setIsInviteOpen(true);
  };

  // Submit Invite Member
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteProjectId) {
      setInviteError('Pilih proyek terlebih dahulu');
      return;
    }
    if (!inviteEmail.trim()) {
      setInviteError('Email anggota wajib diisi');
      return;
    }

    setIsSubmittingInvite(true);
    setInviteError(null);

    try {
      const res = await teamService.createInvitation(inviteProjectId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      const invitation = res.data?.invitation;
      if (invitation) {
        setGeneratedInvitation(invitation);
        showFeedback('success', `Undangan untuk ${inviteEmail.trim()} berhasil dibuat!`);
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal membuat undangan. Pastikan Anda memiliki hak akses.';
      setInviteError(errorMsg);
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Copy invitation token
  const handleCopyToken = () => {
    if (!generatedInvitation) return;
    navigator.clipboard.writeText(generatedInvitation.token);
    setHasCopiedToken(true);
    setTimeout(() => setHasCopiedToken(false), 3000);
  };

  // Open Accept Modal
  const handleOpenAccept = () => {
    setAcceptToken('');
    setAcceptError(null);
    setIsAcceptOpen(true);
  };

  // Submit Accept Invitation
  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptToken.trim()) {
      setAcceptError('Token undangan wajib diisi');
      return;
    }

    setIsSubmittingAccept(true);
    setAcceptError(null);

    try {
      await teamService.acceptInvitation({ token: acceptToken.trim() });
      setIsAcceptOpen(false);
      showFeedback('success', 'Selamat! Anda telah berhasil bergabung dengan proyek.');
      fetchData(); // Refresh all projects and members
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Token undangan tidak valid atau telah kedaluwarsa.';
      setAcceptError(errorMsg);
    } finally {
      setIsSubmittingAccept(false);
    }
  };

  // Open Edit Role Modal
  const handleOpenEditRole = (member: TeamMember) => {
    setEditingMember(member);
    setNewRole(member.role === 'ADMIN' ? 'ADMIN' : 'MEMBER');
    setRoleError(null);
  };

  // Submit Edit Role
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setIsSubmittingRole(true);
    setRoleError(null);

    try {
      const res = await teamService.updateMemberRole(editingMember.projectId, editingMember.id, {
        role: newRole,
      });
      const updated = res.data?.member;

      if (updated) {
        setMembers((prev) =>
          prev.map((m) => (m.id === editingMember.id ? { ...m, role: updated.role } : m)),
        );
      }

      setEditingMember(null);
      showFeedback('success', `Role ${editingMember.user.name} berhasil diubah menjadi ${newRole}`);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal mengubah role anggota';
      setRoleError(errorMsg);
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // Submit Remove Member / Leave
  const handleRemoveMember = async () => {
    if (!removingMember) return;

    setIsSubmittingRemove(true);
    setRemoveError(null);

    const isSelf = removingMember.userId === user?.id;

    try {
      await teamService.removeMember(removingMember.projectId, removingMember.id);
      setMembers((prev) => prev.filter((m) => m.id !== removingMember.id));
      setRemovingMember(null);
      showFeedback(
        'success',
        isSelf
          ? `Anda telah keluar dari proyek ${removingMember.projectName}`
          : `${removingMember.user.name} berhasil dikeluarkan dari proyek`,
      );

      // If user left, refresh projects
      if (isSelf) {
        fetchData();
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal mengeluarkan anggota dari proyek';
      setRemoveError(errorMsg);
    } finally {
      setIsSubmittingRemove(false);
    }
  };

  // Format Date
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm transition-all animate-bounce ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-900/90 text-white border-emerald-700'
              : 'bg-rose-900/90 text-white border-rose-700'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-flow-dark">Team Management</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-flow-primary border border-blue-200">
              {filteredMembers.length} Anggota
            </span>
          </div>
          <p className="text-sm text-flow-muted mt-1">
            Kelola anggota proyek, pantau peran tim, dan bagikan undangan kolaborasi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Segarkan
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenAccept}
            leftIcon={<KeyRound className="w-4 h-4 text-slate-500" />}
          >
            Gabung via Undangan
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenInvite}
            disabled={!canInvite}
            title={!canInvite ? 'Hanya OWNER atau ADMIN yang dapat mengundang anggota' : undefined}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Undang Anggota
          </Button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-flow-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-flow-muted">Total Anggota</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-flow-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-flow-dark">{metrics.total}</span>
            <span className="text-[11px] text-flow-muted">pengguna terdaftar</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-flow-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-flow-muted">Project Owners</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-600">{metrics.owners}</span>
            <span className="text-[11px] text-indigo-500 font-medium">kendali penuh</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-flow-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-flow-muted">Administrators</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{metrics.admins}</span>
            <span className="text-[11px] text-emerald-600 font-medium">pengelola tim</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-flow-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-flow-muted">Regular Members</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-flow-dark">{metrics.regularMembers}</span>
            <span className="text-[11px] text-slate-500 font-medium">kolaborator</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Workspace Selection, Search & Filter */}
      <div className="p-4 rounded-xl bg-white border border-flow-border space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari anggota berdasarkan nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-flow-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-flow-primary"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Project Filter */}
            <div className="flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-flow-border bg-white text-flow-dark font-medium focus:outline-none focus:ring-1 focus:ring-flow-primary text-xs"
              >
                <option value="ALL">Semua Proyek ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-flow-border bg-white text-flow-dark font-medium focus:outline-none focus:ring-1 focus:ring-flow-primary text-xs"
              >
                <option value="ALL">Semua Role</option>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Members Table Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-flow-border p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-8 rounded-xl bg-white border border-rose-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-flow-dark">Gagal Memuat Anggota Tim</h3>
          <p className="text-xs text-flow-muted max-w-sm mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            Coba Lagi
          </Button>
        </div>
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-flow-primary" />}
          title={
            searchQuery || selectedRole !== 'ALL' || selectedProjectId !== 'ALL'
              ? 'Tidak ada anggota yang sesuai dengan filter'
              : 'Belum ada anggota terdaftar'
          }
          description={
            searchQuery || selectedRole !== 'ALL'
              ? 'Coba sesuaikan kata kunci pencarian atau ubah filter role di atas.'
              : 'Undang rekan tim Anda untuk mulai berkolaborasi dalam proyek ini.'
          }
          action={
            canInvite ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenInvite}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Undang Anggota Pertama
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-flow-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-flow-border bg-slate-50/70 text-[11px] font-semibold text-flow-muted uppercase tracking-wider">
                  <th className="py-3 px-4">Anggota</th>
                  <th className="py-3 px-4">Proyek</th>
                  <th className="py-3 px-4 w-32">Role</th>
                  <th className="py-3 px-4 w-40">Bergabung Sejak</th>
                  <th className="py-3 px-4 w-32 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-flow-border/60 text-xs text-flow-dark">
                {filteredMembers.map((member) => {
                  const isSelf = member.userId === user?.id;
                  const currentRole = member.currentUserRoleInProject;
                  const isTargetOwner = member.role === 'OWNER';
                  const isTargetAdmin = member.role === 'ADMIN';

                  // RBAC Actions rules:
                  // Can edit role: OWNER can edit anyone except OWNER. ADMIN cannot edit ADMINs.
                  const canEditRole =
                    !isTargetOwner &&
                    (currentRole === 'OWNER' || (currentRole === 'ADMIN' && !isTargetAdmin && !isSelf));

                  // Can remove: OWNER can remove non-OWNER. ADMIN can remove MEMBER. Member can remove self (leave).
                  const canRemove =
                    !isTargetOwner &&
                    (currentRole === 'OWNER' ||
                      (currentRole === 'ADMIN' && (!isTargetAdmin || isSelf)) ||
                      isSelf);

                  const RoleIcon = ROLE_CONFIG[member.role].icon;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Member Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-flow-primary to-blue-400 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                            {member.user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-flow-dark truncate">
                                {member.user.name}
                              </span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 text-flow-primary">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-flow-muted truncate block">
                              {member.user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Project Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <FolderKanban className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="font-medium text-slate-600 truncate max-w-xs">
                            {member.projectName}
                          </span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs">
                          <RoleIcon
                            className={`w-3.5 h-3.5 ${
                              member.role === 'OWNER'
                                ? 'text-indigo-600'
                                : member.role === 'ADMIN'
                                ? 'text-emerald-600'
                                : 'text-slate-500'
                            }`}
                          />
                          <span
                            className={
                              member.role === 'OWNER'
                                ? 'text-indigo-700'
                                : member.role === 'ADMIN'
                                ? 'text-emerald-700'
                                : 'text-slate-700'
                            }
                          >
                            {ROLE_CONFIG[member.role].label}
                          </span>
                        </div>
                      </td>

                      {/* Joined At */}
                      <td className="py-3.5 px-4 text-flow-muted">
                        {formatDate(member.joinedAt)}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEditRole && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditRole(member)}
                              className="px-2 py-1 rounded text-xs font-medium text-slate-600 hover:text-flow-primary hover:bg-slate-100 transition-colors"
                              title="Ubah Role"
                            >
                              Ubah Role
                            </button>
                          )}

                          {canRemove && (
                            <button
                              type="button"
                              onClick={() => {
                                setRemovingMember(member);
                                setRemoveError(null);
                              }}
                              className={`p-1.5 rounded transition-colors ${
                                isSelf
                                  ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-700'
                                  : 'text-flow-muted hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title={isSelf ? 'Keluar dari Proyek' : 'Keluarkan Anggota'}
                            >
                              {isSelf ? <LogOut className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: INVITE MEMBER */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => !isSubmittingInvite && setIsInviteOpen(false)}
        title="Undang Anggota Tim"
        description="Kirimkan undangan kolaborasi bergabung ke dalam proyek."
        size="md"
      >
        {generatedInvitation ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Undangan Berhasil Dibuat!</span>
              </div>
              <p>
                Undangan untuk <span className="font-semibold">{generatedInvitation.email}</span> sebagai{' '}
                <span className="font-semibold">{generatedInvitation.role}</span> telah siap.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-flow-dark mb-1">
                Token Undangan (Berlaku 7 Hari):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInvitation.token}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-flow-border rounded-lg select-all focus:outline-none"
                />
                <Button
                  type="button"
                  variant={hasCopiedToken ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={handleCopyToken}
                  leftIcon={hasCopiedToken ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {hasCopiedToken ? 'Tersalin' : 'Salin'}
                </Button>
              </div>
              <p className="text-[11px] text-flow-muted mt-1.5">
                Bagikan token ini kepada rekan tim Anda agar mereka dapat memasukkannya melalui tombol{' '}
                <span className="font-semibold">"Gabung via Undangan"</span>.
              </p>
            </div>

            <div className="pt-3 border-t border-flow-border flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setGeneratedInvitation(null);
                  setIsInviteOpen(false);
                }}
              >
                Selesai
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateInvitation} className="space-y-4">
            {inviteError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-flow-dark mb-1">
                Pilih Proyek <span className="text-rose-500">*</span>
              </label>
              <select
                value={inviteProjectId}
                onChange={(e) => setInviteProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs font-medium focus:ring-1 focus:ring-flow-primary focus:outline-none"
                required
              >
                {projects
                  .filter((p) => p.currentUserRole === 'OWNER' || p.currentUserRole === 'ADMIN')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.currentUserRole})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-flow-dark mb-1">
                Email Pengguna <span className="text-rose-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="nama@perusahaan.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-flow-dark mb-1">
                Peran dalam Proyek (Role)
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'MEMBER')}
                className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs font-medium focus:ring-1 focus:ring-flow-primary focus:outline-none"
              >
                <option value="MEMBER">Member (Kolaborator Tugas)</option>
                <option value="ADMIN">Admin (Pengelola Proyek & Tugas)</option>
              </select>
              <p className="text-[11px] text-flow-muted mt-1">
                {ROLE_CONFIG[inviteRole].desc}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-flow-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsInviteOpen(false)}
                disabled={isSubmittingInvite}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingInvite}>
                Buat Undangan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 2: ACCEPT INVITATION TOKEN */}
      <Modal
        isOpen={isAcceptOpen}
        onClose={() => !isSubmittingAccept && setIsAcceptOpen(false)}
        title="Gabung Proyek via Undangan"
        description="Masukkan token undangan yang telah Anda terima dari pemilik proyek."
        size="md"
      >
        <form onSubmit={handleAcceptInvitation} className="space-y-4">
          {acceptError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{acceptError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-flow-dark mb-1">
              Token Undangan <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Tempel token undangan (contoh: a1b2c3d4...)"
              value={acceptToken}
              onChange={(e) => setAcceptToken(e.target.value)}
              required
            />
            <p className="text-[11px] text-flow-muted mt-1.5">
              Token ini ditujukan khusus ke akun email terdaftar Anda ({user?.email}).
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-flow-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAcceptOpen(false)}
              disabled={isSubmittingAccept}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingAccept}>
              Bergabung Sekarang
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: EDIT ROLE */}
      <Modal
        isOpen={!!editingMember}
        onClose={() => !isSubmittingRole && setEditingMember(null)}
        title="Ubah Role Anggota"
        description={editingMember ? `Ubah hak akses ${editingMember.user.name} pada proyek ${editingMember.projectName}` : undefined}
        size="sm"
      >
        {editingMember && (
          <form onSubmit={handleUpdateRole} className="space-y-4">
            {roleError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{roleError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-flow-dark mb-1">Pilih Role Baru</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'ADMIN' | 'MEMBER')}
                className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs font-medium focus:ring-1 focus:ring-flow-primary focus:outline-none"
              >
                <option value="MEMBER">Member (Kolaborator Tugas)</option>
                <option value="ADMIN">Admin (Pengelola Proyek & Tugas)</option>
              </select>
              <p className="text-[11px] text-flow-muted mt-1.5">
                {ROLE_CONFIG[newRole].desc}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-flow-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingMember(null)}
                disabled={isSubmittingRole}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingRole}>
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 4: REMOVE MEMBER / LEAVE CONFIRMATION */}
      <Modal
        isOpen={!!removingMember}
        onClose={() => !isSubmittingRemove && setRemovingMember(null)}
        title={removingMember?.userId === user?.id ? 'Keluar dari Proyek' : 'Keluarkan Anggota'}
        description={
          removingMember?.userId === user?.id
            ? 'Apakah Anda yakin ingin keluar dari proyek ini? Anda akan kehilangan akses ke seluruh tugas proyek ini.'
            : 'Apakah Anda yakin ingin mengeluarkan anggota ini dari proyek?'
        }
        size="sm"
      >
        {removingMember && (
          <div className="space-y-4">
            {removeError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{removeError}</span>
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-50 border border-flow-border text-xs space-y-1">
              <p className="font-semibold text-flow-dark">{removingMember.user.name}</p>
              <p className="text-flow-muted">{removingMember.user.email}</p>
              <p className="text-flow-muted">Proyek: {removingMember.projectName}</p>
            </div>

            <p className="text-xs text-rose-600 font-medium">
              Tugas yang saat ini ditugaskan kepada anggota ini akan otomatis dilepaskan (unassigned).
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-flow-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRemovingMember(null)}
                disabled={isSubmittingRemove}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isSubmittingRemove}
                onClick={handleRemoveMember}
              >
                {removingMember.userId === user?.id ? 'Ya, Keluar' : 'Ya, Keluarkan'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
