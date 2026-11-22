import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  GripVertical,
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
import { Skeleton } from '@/components/ui/Skeleton';

// Status Columns Configuration
const COLUMNS: Array<{
  id: TaskStatus;
  title: string;
  badgeVariant: 'todo' | 'in_progress' | 'review' | 'done';
  accentBorder: string;
  bgLight: string;
}> = [
  {
    id: 'TODO',
    title: 'To Do',
    badgeVariant: 'todo',
    accentBorder: 'border-slate-300',
    bgLight: 'bg-slate-50/70',
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    badgeVariant: 'in_progress',
    accentBorder: 'border-blue-400',
    bgLight: 'bg-blue-50/40',
  },
  {
    id: 'REVIEW',
    title: 'In Review',
    badgeVariant: 'review',
    accentBorder: 'border-amber-400',
    bgLight: 'bg-amber-50/40',
  },
  {
    id: 'DONE',
    title: 'Done',
    badgeVariant: 'done',
    accentBorder: 'border-emerald-400',
    bgLight: 'bg-emerald-50/40',
  },
];

// Priority labels & badges
const PRIORITY_CONFIG: Record<TaskPriority, { label: string; variant: 'low' | 'medium' | 'high' | 'urgent' }> = {
  LOW: { label: 'Low', variant: 'low' },
  MEDIUM: { label: 'Medium', variant: 'medium' },
  HIGH: { label: 'High', variant: 'high' },
  URGENT: { label: 'Urgent', variant: 'urgent' },
};

export const BoardPage: React.FC = () => {
  const { user } = useAuth();

  // State data
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

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

  // Feedback Notification Toast
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Fetch all projects & tasks
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

      // Concurrently ambil seluruh tasks per proyek
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
      setTasks(aggregatedResults.flat());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat Kanban Board';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load project members for Create Modal
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

  // Helper check Overdue
  const isOverdue = (task: Task): boolean => {
    if (!task.dueDate || task.status === 'DONE') return false;
    const dueTime = new Date(task.dueDate).getTime();
    return dueTime < Date.now();
  };

  // Format Due Date
  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // My Tasks toggle
      if (onlyMyTasks && task.assigneeId !== user?.id) {
        return false;
      }

      // Project filter
      if (selectedProjectId !== 'ALL' && task.projectId !== selectedProjectId) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q) ?? false;
        const matchProject = task.projectName?.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchDesc && !matchProject) return false;
      }

      return true;
    });
  }, [tasks, onlyMyTasks, user?.id, selectedProjectId, selectedPriority, searchQuery]);

  // Move Task Status (with optimistic update & rollback)
  const handleMoveStatus = async (task: TaskWithProject, newStatus: TaskStatus) => {
    if (task.status === newStatus) return;

    // RBAC check
    if (task.userProjectRole === 'MEMBER' && task.assigneeId !== user?.id) {
      showFeedback('error', 'Sebagai Member, Anda hanya dapat memindahkan tugas yang ditugaskan kepada Anda');
      return;
    }

    const previousTasks = [...tasks];

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t)),
    );

    try {
      const res = await taskService.updateTask(task.id, { status: newStatus });
      const updated = res.data?.task;
      if (updated) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: updated.status, updatedAt: updated.updatedAt } : t)),
        );
      }
      showFeedback('success', `Tugas dipindahkan ke ${COLUMNS.find((c) => c.id === newStatus)?.title}`);
    } catch (err: unknown) {
      // Rollback on error
      setTasks(previousTasks);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal memindahkan tugas. Membatalkan perubahan.';
      showFeedback('error', errorMsg);
    }
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status !== targetStatus) {
      await handleMoveStatus(task, targetStatus);
    }
  };

  // Open Create Modal
  const handleOpenCreate = (initialStatus: TaskStatus = 'TODO') => {
    setCreateProjectId(projects[0]?.id || '');
    setCreateTitle('');
    setCreateDescription('');
    setCreateStatus(initialStatus);
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
            <h1 className="text-2xl font-bold tracking-tight text-flow-dark">Board</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-flow-primary border border-blue-200">
              Kanban View
            </span>
          </div>
          <p className="text-sm text-flow-muted mt-1">
            Visualisasikan alur kerja tugas secara dinamis. Pindahkan kartu antar kolom status dengan mudah.
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
            onClick={() => handleOpenCreate('TODO')}
            disabled={projects.length === 0}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tugas Baru
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-flow-border space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tugas atau nama proyek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-flow-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-flow-primary"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Toggle My Tasks Only */}
            <button
              type="button"
              onClick={() => setOnlyMyTasks((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
                onlyMyTasks
                  ? 'bg-blue-50 text-flow-primary border-blue-200 shadow-xs'
                  : 'bg-white text-flow-muted border-flow-border hover:text-flow-dark'
              }`}
            >
              Ditugaskan ke Saya
            </button>

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

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Kanban Board Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className="p-4 rounded-xl bg-white border border-flow-border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-xl bg-white border border-rose-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-flow-dark">Gagal Memuat Board</h3>
          <p className="text-xs text-flow-muted max-w-sm mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            Coba Lagi
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col, colIndex) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.id);
            const isTargetDrop = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex flex-col rounded-xl bg-slate-50/60 border transition-all duration-150 min-h-[500px] ${
                  isTargetDrop
                    ? 'border-flow-primary ring-2 ring-flow-primary/20 bg-blue-50/20'
                    : 'border-flow-border'
                }`}
              >
                {/* Column Header */}
                <div
                  className={`flex items-center justify-between p-3.5 bg-white rounded-t-xl border-b border-flow-border border-t-2 ${col.accentBorder}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-flow-dark tracking-wide">{col.title}</span>
                    <Badge variant={col.badgeVariant} size="sm">
                      {columnTasks.length}
                    </Badge>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenCreate(col.id)}
                    disabled={projects.length === 0}
                    className="p-1 rounded-md text-flow-muted hover:text-flow-dark hover:bg-slate-100 transition-colors"
                    title={`Tambah tugas ke ${col.title}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Column Cards Container */}
                <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-260px)]">
                  {columnTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-3 text-center border border-dashed border-slate-200 rounded-lg">
                      <p className="text-[11px] font-medium text-slate-400">Tidak ada tugas</p>
                      <button
                        type="button"
                        onClick={() => handleOpenCreate(col.id)}
                        disabled={projects.length === 0}
                        className="mt-1.5 text-[11px] font-semibold text-flow-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Tambah
                      </button>
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const overdue = isOverdue(task);
                      const formattedDue = formatDueDate(task.dueDate);
                      const canEditFull = task.userProjectRole === 'OWNER' || task.userProjectRole === 'ADMIN';
                      const canUpdateStatus = canEditFull || task.assigneeId === user?.id;

                      return (
                        <div
                          key={task.id}
                          draggable={canUpdateStatus}
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => handleOpenEdit(task)}
                          className={`p-3.5 rounded-xl bg-white border border-flow-border shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer group relative ${
                            draggedTaskId === task.id ? 'opacity-40 scale-95' : 'opacity-100'
                          }`}
                        >
                          {/* Drag handle & Project label */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <FolderKanban className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span className="text-[11px] font-semibold text-slate-500 truncate">
                                {task.projectName || 'Proyek'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <Badge variant={PRIORITY_CONFIG[task.priority].variant} size="sm" hasDot>
                                {PRIORITY_CONFIG[task.priority].label}
                              </Badge>
                              {canUpdateStatus && (
                                <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing" />
                              )}
                            </div>
                          </div>

                          {/* Task Title */}
                          <h4
                            className={`text-xs font-bold text-flow-dark leading-snug line-clamp-2 group-hover:text-flow-primary transition-colors ${
                              task.status === 'DONE' ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {task.title}
                          </h4>

                          {/* Description snippet */}
                          {task.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Card Footer: Due Date & Assignee */}
                          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[11px]">
                            {/* Deadline info */}
                            {formattedDue ? (
                              <div
                                className={`flex items-center gap-1 font-medium ${
                                  overdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                                }`}
                                title={overdue ? 'Melewati batas tenggat waktu!' : undefined}
                              >
                                {overdue ? (
                                  <AlertTriangle className="w-3 h-3 text-rose-600 flex-shrink-0" />
                                ) : (
                                  <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                )}
                                <span>{formattedDue}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-[10px]">Tanpa deadline</span>
                            )}

                            {/* Assignee Avatar / Indicator */}
                            {task.assignee ? (
                              <div
                                className="flex items-center gap-1.5"
                                title={`Ditugaskan ke: ${task.assignee.name}`}
                              >
                                <div className="w-5 h-5 rounded-full bg-blue-100 text-flow-primary flex items-center justify-center text-[9px] font-bold">
                                  {task.assignee.name.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="text-[10px] text-slate-600 max-w-[70px] truncate">
                                  {task.assignee.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">Unassigned</span>
                            )}
                          </div>

                          {/* Quick Shift Buttons (Reliable controls for mobile/touch/desktop) */}
                          {canUpdateStatus && (
                            <div
                              className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100/70"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {colIndex > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleMoveStatus(task, COLUMNS[colIndex - 1].id)}
                                  className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-flow-primary px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
                                  title={`Kembalikan ke ${COLUMNS[colIndex - 1].title}`}
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                  <span>{COLUMNS[colIndex - 1].title}</span>
                                </button>
                              ) : (
                                <span />
                              )}

                              {colIndex < COLUMNS.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveStatus(task, COLUMNS[colIndex + 1].id)}
                                  className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-flow-primary px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors ml-auto"
                                  title={`Pindahkan ke ${COLUMNS[colIndex + 1].title}`}
                                >
                                  <span>{COLUMNS[colIndex + 1].title}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CREATE TASK */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !isSubmittingCreate && setIsCreateOpen(false)}
        title="Buat Tugas Baru"
        description="Tambahkan kartu tugas baru ke dalam Kanban Board."
        size="lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

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

          <div>
            <label className="block text-xs font-semibold text-flow-dark mb-1">
              Judul Tugas <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Desain Arsitektur Database"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              maxLength={150}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-flow-dark mb-1">Deskripsi Tugas (Opsional)</label>
            <textarea
              rows={3}
              placeholder="Jelaskan kebutuhan tugas..."
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              maxLength={2000}
              className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs placeholder:text-slate-400 focus:ring-1 focus:ring-flow-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-flow-dark mb-1">Kolom Status</label>
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
              <label className="block text-xs font-semibold text-flow-dark mb-1">Tenggat Waktu</label>
              <input
                type="date"
                value={createDueDate}
                onChange={(e) => setCreateDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs font-medium focus:ring-1 focus:ring-flow-primary focus:outline-none"
              />
            </div>
          </div>

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
              Buat Kartu
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-flow-dark mb-1">Status Kolom</label>
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

            <div className="flex items-center justify-between pt-3 border-t border-flow-border">
              {editingTask.userProjectRole !== 'MEMBER' ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const taskToDelete = editingTask;
                    setEditingTask(null);
                    setDeletingTask(taskToDelete);
                  }}
                >
                  Hapus
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
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
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: DELETE CONFIRMATION */}
      <Modal
        isOpen={!!deletingTask}
        onClose={() => !isSubmittingDelete && setDeletingTask(null)}
        title="Hapus Kartu Tugas"
        description="Apakah Anda yakin ingin menghapus tugas ini dari board secara permanen?"
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
              Tindakan ini tidak dapat dibatalkan. Hanya OWNER dan ADMIN yang diizinkan untuk menghapus tugas.
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
                Ya, Hapus
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
