import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import type { Project, ProjectMember } from '@/types/project';
import type { Task, TaskPriority, TaskStatus, TaskWithProject } from '@/types/task';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

// Status labels & badges
const STATUS_CONFIG: Record<TaskStatus, { label: string; variant: 'todo' | 'in_progress' | 'review' | 'done' }> = {
  TODO: { label: 'To Do', variant: 'todo' },
  IN_PROGRESS: { label: 'In Progress', variant: 'in_progress' },
  REVIEW: { label: 'In Review', variant: 'review' },
  DONE: { label: 'Done', variant: 'done' },
};

// Priority labels & badges
const PRIORITY_CONFIG: Record<TaskPriority, { label: string; variant: 'low' | 'medium' | 'high' | 'urgent' }> = {
  LOW: { label: 'Low', variant: 'low' },
  MEDIUM: { label: 'Medium', variant: 'medium' },
  HIGH: { label: 'High', variant: 'high' },
  URGENT: { label: 'Urgent', variant: 'urgent' },
};

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const MyTasksPage: React.FC = () => {
  const { user } = useAuth();

  // State data utama
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search State
  const [activeTab, setActiveTab] = useState<'assigned_to_me' | 'all'>('assigned_to_me');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'due_asc' | 'due_desc' | 'priority_desc' | 'created_desc'>('due_asc');

  // Modal State: Create Task
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createProjectId, setCreateProjectId] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createStatus, setCreateStatus] = useState<TaskStatus>('TODO');
  const [createPriority, setCreatePriority] = useState<TaskPriority>('MEDIUM');
  const [createAssigneeId, setCreateAssigneeId] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal State: Edit Task
  const [editingTask, setEditingTask] = useState<TaskWithProject | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('TODO');
  const [editPriority, setEditPriority] = useState<TaskPriority>('MEDIUM');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editMembers, setEditMembers] = useState<ProjectMember[]>([]);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal State: Delete Task
  const [deletingTask, setDeletingTask] = useState<TaskWithProject | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Quick Notification Banner
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Fetch all projects & their tasks
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projRes = await projectService.getProjects();
      const projectList = projRes.data?.projects || [];
      setProjects(projectList);

      if (projectList.length === 0) {
        setTasks([]);
        setIsLoading(false);
        return;
      }

      // Concurrently ambil tasks dari semua project
      const tasksPromises = projectList.map(async (project) => {
        try {
          const taskRes = await taskService.getProjectTasks(project.id);
          const projectTasks = taskRes.data?.tasks || [];
          return projectTasks.map((t) => ({
            ...t,
            projectName: project.name,
            projectOwnerId: project.ownerId,
            userProjectRole: project.currentUserRole,
          }));
        } catch {
          return [];
        }
      });

      const aggregatedResults = await Promise.all(tasksPromises);
      const allTasks = aggregatedResults.flat();
      setTasks(allTasks);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar tugas';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load project members when createProjectId changes
  useEffect(() => {
    if (!createProjectId) {
      setProjectMembers([]);
      return;
    }
    projectService
      .getProjectMembers(createProjectId)
      .then((res) => {
        setProjectMembers(res.data?.members || []);
      })
      .catch(() => {
        setProjectMembers([]);
      });
  }, [createProjectId]);

  // Helper Check Overdue
  const isOverdue = (task: Task): boolean => {
    if (!task.dueDate || task.status === 'DONE') return false;
    const dueTime = new Date(task.dueDate).getTime();
    return dueTime < Date.now();
  };

  // Format Due Date
  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return 'Tanpa tenggat';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // KPI Metrics
  const metrics = useMemo(() => {
    const userTasks = tasks.filter((t) => t.assigneeId === user?.id);
    const relevantTasks = activeTab === 'assigned_to_me' ? userTasks : tasks;

    const total = relevantTasks.length;
    const completed = relevantTasks.filter((t) => t.status === 'DONE').length;
    const pending = total - completed;
    const overdue = relevantTasks.filter(isOverdue).length;

    return { total, completed, pending, overdue };
  }, [tasks, activeTab, user?.id]);

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Tab filter
        if (activeTab === 'assigned_to_me' && task.assigneeId !== user?.id) {
          return false;
        }

        // Project filter
        if (selectedProjectId !== 'ALL' && task.projectId !== selectedProjectId) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL' && task.status !== selectedStatus) {
          return false;
        }

        // Priority filter
        if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description?.toLowerCase().includes(q) ?? false;
          const matchProject = task.projectName?.toLowerCase().includes(q) ?? false;
          if (!matchTitle && !matchDesc && !matchProject) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'due_asc') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortBy === 'due_desc') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        }
        if (sortBy === 'priority_desc') {
          return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        }
        if (sortBy === 'created_desc') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [tasks, activeTab, user?.id, selectedProjectId, selectedStatus, selectedPriority, searchQuery, sortBy]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setCreateProjectId(projects[0]?.id || '');
    setCreateTitle('');
    setCreateDescription('');
    setCreateStatus('TODO');
    setCreatePriority('MEDIUM');
    setCreateAssigneeId(user?.id || '');
    setCreateDueDate('');
    setCreateError(null);
    setIsCreateOpen(true);
  };

  // Submit Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createProjectId) {
      setCreateError('Pilih proyek terlebih dahulu');
      return;
    }
    if (!createTitle.trim()) {
      setCreateError('Judul tugas wajib diisi');
      return;
    }

    setIsSubmittingCreate(true);
    setCreateError(null);

    try {
      const res = await taskService.createTask(createProjectId, {
        title: createTitle.trim(),
        description: createDescription.trim() || null,
        status: createStatus,
        priority: createPriority,
        assigneeId: createAssigneeId || null,
        dueDate: createDueDate ? new Date(createDueDate).toISOString() : null,
      });

      const newTask = res.data?.task;
      if (newTask) {
        const targetProj = projects.find((p) => p.id === createProjectId);
        const enriched: TaskWithProject = {
          ...newTask,
          projectName: targetProj?.name,
          projectOwnerId: targetProj?.ownerId,
          userProjectRole: targetProj?.currentUserRole,
        };
        setTasks((prev) => [enriched, ...prev]);
      }

      setIsCreateOpen(false);
      showFeedback('success', `Tugas "${createTitle.trim()}" berhasil dibuat!`);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal membuat tugas. Pastikan input valid.';
      setCreateError(errorMsg);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = async (task: TaskWithProject) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditAssigneeId(task.assigneeId || '');
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setEditError(null);

    // Ambil members proyek terkait untuk dropdown assignee
    try {
      const membersRes = await projectService.getProjectMembers(task.projectId);
      setEditMembers(membersRes.data?.members || []);
    } catch {
      setEditMembers([]);
    }
  };

  // Submit Edit Task
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    setIsSubmittingEdit(true);
    setEditError(null);

    const isMemberOnly = editingTask.userProjectRole === 'MEMBER';

    try {
      // Jika user role MEMBER, backend hanya mengizinkan update status
      const payload = isMemberOnly
        ? { status: editStatus }
        : {
            title: editTitle.trim(),
            description: editDescription.trim() || null,
            status: editStatus,
            priority: editPriority,
            assigneeId: editAssigneeId || null,
            dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
          };

      const res = await taskService.updateTask(editingTask.id, payload);
      const updated = res.data?.task;

      if (updated) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === updated.id
              ? {
                  ...t,
                  ...updated,
                  projectName: t.projectName,
                  projectOwnerId: t.projectOwnerId,
                  userProjectRole: t.userProjectRole,
                }
              : t,
          ),
        );
      }

      setEditingTask(null);
      showFeedback('success', 'Tugas berhasil diperbarui');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal memperbarui tugas';
      setEditError(errorMsg);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Quick Status Toggle directly from list
  const handleQuickStatusChange = async (task: TaskWithProject, newStatus: TaskStatus) => {
    if (task.status === newStatus) return;

    // Cek otorisasi MEMBER
    if (task.userProjectRole === 'MEMBER' && task.assigneeId !== user?.id) {
      showFeedback('error', 'Sebagai Member, Anda hanya dapat mengubah status tugas Anda sendiri');
      return;
    }

    try {
      const res = await taskService.updateTask(task.id, { status: newStatus });
      const updated = res.data?.task;
      if (updated) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: updated.status, updatedAt: updated.updatedAt } : t)),
        );
        showFeedback('success', `Status "${task.title}" diubah ke ${STATUS_CONFIG[newStatus].label}`);
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal mengubah status tugas';
      showFeedback('error', errorMsg);
    }
  };

  // Submit Delete Task
  const handleDeleteTask = async () => {
    if (!deletingTask) return;

    setIsSubmittingDelete(true);
    setDeleteError(null);

    try {
      await taskService.deleteTask(deletingTask.id);
      setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
      setDeletingTask(null);
      showFeedback('success', `Tugas "${deletingTask.title}" berhasil dihapus`);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menghapus tugas. Pastikan Anda memiliki hak akses OWNER atau ADMIN';
      setDeleteError(errorMsg);
    } finally {
      setIsSubmittingDelete(false);
    }
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
            <h1 className="text-2xl font-bold tracking-tight text-flow-dark">My Tasks</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-flow-primary border border-blue-200">
              {filteredTasks.length} Tugas
            </span>
          </div>
          <p className="text-sm text-flow-muted mt-1">
            Pantau, atur status, dan kelola seluruh tugas yang terhubung dengan akun Anda.
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
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            disabled={projects.length === 0}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tugas Baru
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-flow-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-flow-muted">Total Tugas</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-flow-primary">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-flow-dark">{metrics.total}</span>
            <span className="text-[11px] text-flow-muted">semua filter</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-flow-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-flow-muted">Tertunda</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-flow-dark">{metrics.pending}</span>
            <span className="text-[11px] text-amber-600 font-medium">butuh tindakan</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-flow-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-flow-muted">Selesai</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-flow-dark">{metrics.completed}</span>
            <span className="text-[11px] text-emerald-600 font-medium">tercapai</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-flow-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-flow-muted">Melewati Deadline</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{metrics.overdue}</span>
            <span className="text-[11px] text-rose-500 font-medium">perlu diprioritaskan</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Scope Tabs, Search, and Filters */}
      <div className="p-4 rounded-xl bg-white border border-flow-border space-y-4 shadow-xs">
        {/* Top bar: Tabs & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('assigned_to_me')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'assigned_to_me'
                  ? 'bg-white text-flow-dark shadow-xs'
                  : 'text-flow-muted hover:text-flow-dark'
              }`}
            >
              Ditugaskan ke Saya
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-flow-dark shadow-xs'
                  : 'text-flow-muted hover:text-flow-dark'
              }`}
            >
              Semua Tugas Proyek
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tugas atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-flow-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-flow-primary"
            />
          </div>
        </div>

        {/* Filter Badges & Sorters */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-flow-border/60 text-xs">
          <div className="flex items-center gap-1.5 text-flow-muted font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Project Dropdown */}
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

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-flow-border bg-white text-flow-dark font-medium focus:outline-none focus:ring-1 focus:ring-flow-primary text-xs"
          >
            <option value="ALL">Semua Status</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-flow-border bg-white text-flow-dark font-medium focus:outline-none focus:ring-1 focus:ring-flow-primary text-xs"
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Sort By Dropdown */}
          <div className="ml-auto flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-2.5 py-1.5 rounded-lg border border-flow-border bg-white text-flow-dark font-medium focus:outline-none focus:ring-1 focus:ring-flow-primary text-xs"
            >
              <option value="due_asc">Deadline Terdekat</option>
              <option value="due_desc">Deadline Terjauh</option>
              <option value="priority_desc">Prioritas Tertinggi</option>
              <option value="created_desc">Baru Dibuat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Task List / Table Area */}
      {isLoading ? (
        <div className="p-6 rounded-xl bg-white border border-flow-border space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-8 rounded-xl bg-white border border-rose-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-flow-dark">Gagal Memuat Tugas</h3>
          <p className="text-xs text-flow-muted max-w-sm mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            Coba Lagi
          </Button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8 text-flow-primary" />}
          title={
            searchQuery || selectedProjectId !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL'
              ? 'Tidak ada tugas yang cocok dengan filter'
              : activeTab === 'assigned_to_me'
              ? 'Belum ada tugas yang ditugaskan kepada Anda'
              : 'Belum ada tugas dalam proyek'
          }
          description={
            searchQuery || selectedProjectId !== 'ALL' || selectedStatus !== 'ALL'
              ? 'Coba sesuaikan kata kunci pencarian atau ubah pengaturan filter di atas.'
              : 'Mulai dengan menambahkan tugas baru pada proyek Anda untuk memantau kemajuan kerja.'
          }
          action={
            projects.length > 0 ? (
              <Button variant="primary" size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
                Buat Tugas Pertama
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
                  <th className="py-3 px-4 w-36">Status</th>
                  <th className="py-3 px-4">Tugas & Proyek</th>
                  <th className="py-3 px-4 w-28">Prioritas</th>
                  <th className="py-3 px-4 w-40">Tenggat Waktu</th>
                  <th className="py-3 px-4 w-36">Penanggung Jawab</th>
                  <th className="py-3 px-4 w-20 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-flow-border/60 text-xs text-flow-dark">
                {filteredTasks.map((task) => {
                  const overdue = isOverdue(task);
                  const canEditFull = task.userProjectRole === 'OWNER' || task.userProjectRole === 'ADMIN';
                  const canUpdateStatus = canEditFull || task.assigneeId === user?.id;
                  const canDelete = canEditFull;

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenEdit(task)}
                    >
                      {/* Status quick select */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.status}
                          disabled={!canUpdateStatus}
                          onChange={(e) => handleQuickStatusChange(task, e.target.value as TaskStatus)}
                          className={`text-xs font-semibold px-2 py-1 rounded-md border transition-all cursor-pointer ${
                            task.status === 'DONE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : task.status === 'REVIEW'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="REVIEW">In Review</option>
                          <option value="DONE">Done</option>
                        </select>
                      </td>

                      {/* Title & Project Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span
                            className={`font-semibold text-flow-dark leading-snug group-hover:text-flow-primary transition-colors ${
                              task.status === 'DONE' ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {task.title}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] text-flow-muted mt-0.5">
                            <FolderKanban className="w-3 h-3 text-slate-400" />
                            <span className="font-medium text-slate-500">{task.projectName || 'Proyek'}</span>
                            {task.description && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-xs text-slate-400">{task.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <Badge variant={PRIORITY_CONFIG[task.priority].variant} size="sm" hasDot>
                          {PRIORITY_CONFIG[task.priority].label}
                        </Badge>
                      </td>

                      {/* Due Date & Overdue flag */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar
                            className={`w-3.5 h-3.5 flex-shrink-0 ${
                              overdue ? 'text-rose-600' : 'text-slate-400'
                            }`}
                          />
                          <span className={`font-medium ${overdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                            {formatDueDate(task.dueDate)}
                          </span>
                        </div>
                        {overdue && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-semibold mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Terlewat
                          </span>
                        )}
                      </td>

                      {/* Assignee */}
                      <td className="py-3.5 px-4">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-flow-primary flex items-center justify-center text-[10px] font-bold">
                              {task.assignee.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[100px] text-flow-dark font-medium">
                              {task.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum ditugaskan</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(task)}
                            className="p-1.5 rounded-md text-flow-muted hover:text-flow-dark hover:bg-slate-100 transition-colors"
                            title="Edit atau Lihat Detail"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingTask(task);
                                setDeleteError(null);
                              }}
                              className="p-1.5 rounded-md text-flow-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Tugas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL 1: CREATE TASK */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !isSubmittingCreate && setIsCreateOpen(false)}
        title="Buat Tugas Baru"
        description="Tambahkan tugas baru ke dalam salah satu proyek Anda."
        size="lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          {/* Project Selection */}
          <div>
            <label className="block text-xs font-semibold text-flow-dark mb-1">
              Pilih Proyek <span className="text-rose-500">*</span>
            </label>
            <select
              value={createProjectId}
              onChange={(e) => setCreateProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs font-medium focus:ring-1 focus:ring-flow-primary focus:outline-none"
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold text-flow-dark mb-1">
              Judul Tugas <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Implementasi Autentikasi JWT"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              maxLength={150}
              required
            />
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-xs font-semibold text-flow-dark mb-1">Deskripsi Tugas (Opsional)</label>
            <textarea
              rows={3}
              placeholder="Jelaskan instruksi atau acceptance criteria tugas..."
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              maxLength={2000}
              className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs placeholder:text-slate-400 focus:ring-1 focus:ring-flow-primary focus:outline-none"
            />
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-flow-dark mb-1">Status Awal</label>
              <select
                value={createStatus}
                onChange={(e) => setCreateStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs font-medium focus:ring-1 focus:ring-flow-primary focus:outline-none"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-flow-dark mb-1">Prioritas</label>
              <select
                value={createPriority}
                onChange={(e) => setCreatePriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs font-medium focus:ring-1 focus:ring-flow-primary focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Assignee & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-flow-dark mb-1">Penanggung Jawab (Assignee)</label>
              <select
                value={createAssigneeId}
                onChange={(e) => setCreateAssigneeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs font-medium focus:ring-1 focus:ring-flow-primary focus:outline-none"
              >
                <option value="">Belum Ditugaskan</option>
                {projectMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-flow-dark mb-1">Tenggat Waktu (Due Date)</label>
              <input
                type="date"
                value={createDueDate}
                onChange={(e) => setCreateDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs font-medium focus:ring-1 focus:ring-flow-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-flow-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmittingCreate}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingCreate}>
              Buat Tugas
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: EDIT / DETAIL TASK */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => !isSubmittingEdit && setEditingTask(null)}
        title="Detail & Ubah Tugas"
        description={
          editingTask
            ? `Proyek: ${editingTask.projectName} • Role Anda: ${editingTask.userProjectRole || 'MEMBER'}`
            : undefined
        }
        size="lg"
      >
        {editingTask && (
          <form onSubmit={handleUpdateTask} className="space-y-4">
            {editError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Role Notice if MEMBER */}
            {editingTask.userProjectRole === 'MEMBER' && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>
                  Sesuai kebijakan RBAC, anggota tim (MEMBER) hanya dapat memperbarui status tugas yang ditugaskan kepada
                  Anda.
                </span>
              </div>
            )}

            {/* Task Title */}
            <div>
              <label className="block text-xs font-semibold text-flow-dark mb-1">Judul Tugas</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={150}
                disabled={editingTask.userProjectRole === 'MEMBER'}
                required
              />
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-xs font-semibold text-flow-dark mb-1">Deskripsi Tugas</label>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                maxLength={2000}
                disabled={editingTask.userProjectRole === 'MEMBER'}
                className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs placeholder:text-slate-400 focus:ring-1 focus:ring-flow-primary focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-flow-dark mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs font-medium focus:ring-1 focus:ring-flow-primary focus:outline-none"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-flow-dark mb-1">Prioritas</label>
                <select
                  value={editPriority}
                  disabled={editingTask.userProjectRole === 'MEMBER'}
                  onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs font-medium focus:ring-1 focus:ring-flow-primary focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Assignee & Due Date Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-flow-dark mb-1">Penanggung Jawab</label>
                <select
                  value={editAssigneeId}
                  disabled={editingTask.userProjectRole === 'MEMBER'}
                  onChange={(e) => setEditAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs font-medium focus:ring-1 focus:ring-flow-primary focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Belum Ditugaskan</option>
                  {editMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-flow-dark mb-1">Tenggat Waktu</label>
                <input
                  type="date"
                  value={editDueDate}
                  disabled={editingTask.userProjectRole === 'MEMBER'}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs font-medium focus:ring-1 focus:ring-flow-primary focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-flow-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingTask(null)}
                disabled={isSubmittingEdit}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingEdit}>
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: DELETE CONFIRMATION */}
      <Modal
        isOpen={!!deletingTask}
        onClose={() => !isSubmittingDelete && setDeletingTask(null)}
        title="Hapus Tugas"
        description="Apakah Anda yakin ingin menghapus tugas ini secara permanen?"
        size="sm"
      >
        {deletingTask && (
          <div className="space-y-4">
            {deleteError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-50 border border-flow-border text-xs">
              <p className="font-semibold text-flow-dark">{deletingTask.title}</p>
              <p className="text-flow-muted mt-0.5">Proyek: {deletingTask.projectName}</p>
            </div>

            <p className="text-xs text-rose-600 font-medium">
              Tindakan ini tidak dapat dibatalkan. Hanya OWNER dan ADMIN proyek yang dapat menghapus tugas.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-flow-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingTask(null)}
                disabled={isSubmittingDelete}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isSubmittingDelete}
                onClick={handleDeleteTask}
              >
                Ya, Hapus Tugas
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
