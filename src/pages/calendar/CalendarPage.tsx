import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Clock,
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

// Status labels & color styling
const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  TODO: {
    label: 'To Do',
    dot: 'bg-slate-400',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    dot: 'bg-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  REVIEW: {
    label: 'In Review',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  DONE: {
    label: 'Done',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
};

// Priority labels & badges
const PRIORITY_CONFIG: Record<TaskPriority, { label: string; variant: 'low' | 'medium' | 'high' | 'urgent' }> = {
  LOW: { label: 'Low', variant: 'low' },
  MEDIUM: { label: 'Medium', variant: 'medium' },
  HIGH: { label: 'High', variant: 'high' },
  URGENT: { label: 'Urgent', variant: 'urgent' },
};

const DAYS_OF_WEEK = [
  { short: 'Sen', full: 'Senin' },
  { short: 'Sel', full: 'Selasa' },
  { short: 'Rab', full: 'Rabu' },
  { short: 'Kam', full: 'Kamis' },
  { short: 'Jum', full: 'Jumat' },
  { short: 'Sab', full: 'Sabtu' },
  { short: 'Min', full: 'Minggu' },
];

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

// Helper to format date YYYY-MM-DD
const formatDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();

  // State tanggal kalender aktif (fokus bulan & tahun)
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // State data utama
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);

  // Modal State: Selected Day Details
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

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

  // Fetch projects and all project tasks
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
      const msg = err instanceof Error ? err.message : 'Gagal memuat tugas kalender';
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

  // Check Overdue
  const isOverdue = (task: Task): boolean => {
    if (!task.dueDate || task.status === 'DONE') return false;
    const dueTime = new Date(task.dueDate).getTime();
    return dueTime < Date.now();
  };

  // Today key
  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  // Filtered Tasks with valid dueDate
  const validDatedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Must have valid dueDate
        if (!task.dueDate) return false;

        // My Tasks toggle
        if (onlyMyTasks && task.assigneeId !== user?.id) return false;

        // Project filter
        if (selectedProjectId !== 'ALL' && task.projectId !== selectedProjectId) return false;

        // Status filter
        if (selectedStatus !== 'ALL' && task.status !== selectedStatus) return false;

        // Priority filter
        if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) return false;

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
      .map((t) => ({
        ...t,
        dateKey: formatDateKey(new Date(t.dueDate!)),
      }));
  }, [tasks, onlyMyTasks, user?.id, selectedProjectId, selectedStatus, selectedPriority, searchQuery]);

  // Group tasks by Date Key
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskWithProject[]>();
    for (const t of validDatedTasks) {
      const arr = map.get(t.dateKey) || [];
      arr.push(t);
      map.set(t.dateKey, arr);
    }
    return map;
  }, [validDatedTasks]);

  // Calendar Grid Calculation (Senin-Minggu)
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Hari pertama bulan aktif
    const firstDay = new Date(year, month, 1);
    // Hari Senin = 0, Minggu = 6
    const firstDayIndex = (firstDay.getDay() + 6) % 7;

    // Jumlah hari bulan ini
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    // Jumlah hari bulan lalu
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      dateKey: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Hari trailing dari bulan lalu
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      const key = formatDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNum: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: key === todayKey,
      });
    }

    // Hari di bulan aktif
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const d = new Date(year, month, i);
      const key = formatDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNum: i,
        isCurrentMonth: true,
        isToday: key === todayKey,
      });
    }

    // Hari leading dari bulan depan untuk melengkapi grid (total kelipatan 7: 35 atau 42)
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const key = formatDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNum: i,
        isCurrentMonth: false,
        isToday: key === todayKey,
      });
    }

    return days;
  }, [currentDate, todayKey]);

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  // Open Create Modal (optionally with prefilled date)
  const handleOpenCreate = (prefilledDate?: string) => {
    setCreateProjectId(projects[0]?.id || '');
    setCreateTitle('');
    setCreateDescription('');
    setCreateStatus('TODO');
    setCreatePriority('MEDIUM');
    setCreateAssigneeId(user?.id || '');
    setCreateDueDate(prefilledDate || formatDateKey(new Date()));
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
      showFeedback('success', `Tugas "${createTitle.trim()}" berhasil dijadwalkan!`);
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
      showFeedback('success', 'Jadwal tugas berhasil diperbarui');
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

  // Selected Day tasks for popup list
  const selectedDayTasks = selectedDayKey ? tasksByDate.get(selectedDayKey) || [] : [];

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
            <h1 className="text-2xl font-bold tracking-tight text-flow-dark">Calendar</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-flow-primary border border-blue-200">
              Monthly Schedule
            </span>
          </div>
          <p className="text-sm text-flow-muted mt-1">
            Pantau tenggat waktu dan jadwal penyelesaian tugas Anda secara kronologis.
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
            onClick={() => handleOpenCreate()}
            disabled={projects.length === 0}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tugas Baru
          </Button>
        </div>
      </div>

      {/* Filter and Month Navigation Bar */}
      <div className="p-4 rounded-xl bg-white border border-flow-border space-y-4 shadow-xs">
        {/* Top: Month Switcher & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-flow-border/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-flow-primary">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-flow-dark tracking-tight">
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <span className="text-xs text-flow-muted font-medium">
                {validDatedTasks.length} tugas berdeadline ditemukan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleGoToday}>
              Hari Ini
            </Button>
            <div className="flex items-center rounded-lg border border-flow-border bg-white shadow-xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 text-flow-muted hover:text-flow-dark hover:bg-slate-50 border-r border-flow-border rounded-l-lg transition-colors"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 text-flow-muted hover:text-flow-dark hover:bg-slate-50 rounded-r-lg transition-colors"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom: Search & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tugas di kalender..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-flow-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-flow-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
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
            </div>

            {/* Priority Filter */}
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

      {/* Main Calendar View */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-flow-border p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-8 rounded-xl bg-white border border-rose-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-flow-dark">Gagal Memuat Kalender</h3>
          <p className="text-xs text-flow-muted max-w-sm mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            Coba Lagi
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-flow-border shadow-xs overflow-hidden">
          {/* Calendar Weekday Headers (Senin - Minggu) */}
          <div className="grid grid-cols-7 border-b border-flow-border bg-slate-50/80 text-center text-xs font-semibold text-flow-dark">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d.short} className="py-2.5 px-1 border-r last:border-r-0 border-flow-border">
                <span className="hidden sm:inline">{d.full}</span>
                <span className="sm:hidden">{d.short}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-y divide-x divide-flow-border">
            {calendarDays.map((cell) => {
              const dayTasks = tasksByDate.get(cell.dateKey) || [];
              const hasTasks = dayTasks.length > 0;
              const maxDisplay = 2; // Show top 2 tasks directly, rest collapsed into badge
              const visibleTasks = dayTasks.slice(0, maxDisplay);
              const extraCount = dayTasks.length - maxDisplay;

              return (
                <div
                  key={cell.dateKey}
                  onClick={() => setSelectedDayKey(cell.dateKey)}
                  className={`min-h-[110px] sm:min-h-[130px] p-1.5 sm:p-2 transition-colors cursor-pointer group flex flex-col justify-between ${
                    cell.isCurrentMonth
                      ? 'bg-white hover:bg-slate-50/70'
                      : 'bg-slate-50/40 text-slate-400 hover:bg-slate-100/60'
                  } ${cell.isToday ? 'bg-blue-50/20' : ''}`}
                >
                  {/* Cell Header: Date Number & Add Shortcut */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full transition-all ${
                        cell.isToday
                          ? 'bg-flow-primary text-white shadow-xs'
                          : cell.isCurrentMonth
                          ? 'text-flow-dark group-hover:text-flow-primary'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Quick Add Button on Hover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreate(cell.dateKey);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-flow-muted hover:text-flow-primary hover:bg-blue-50 transition-all"
                      title={`Tambah tugas pada ${cell.dateKey}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Cell Task Pills */}
                  <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                    {visibleTasks.map((task) => {
                      const overdue = isOverdue(task);
                      const statusCfg = STATUS_CONFIG[task.status];

                      return (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(task);
                          }}
                          className={`px-1.5 py-1 rounded-md text-[11px] font-medium border transition-all truncate flex items-center gap-1.5 cursor-pointer shadow-2xs ${statusCfg.bg} ${statusCfg.border} hover:border-slate-400`}
                          title={`${task.title} (${statusCfg.label}) • Proyek: ${task.projectName}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
                          <span
                            className={`truncate flex-1 ${
                              task.status === 'DONE' ? 'line-through text-slate-400' : 'text-flow-dark'
                            }`}
                          >
                            {task.title}
                          </span>
                          {overdue && (
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-600 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}

                    {/* "+N lainnya" badge */}
                    {extraCount > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayKey(cell.dateKey);
                        }}
                        className="w-full text-left px-1.5 py-0.5 text-[10px] font-semibold text-flow-primary hover:underline block"
                      >
                        +{extraCount} lainnya
                      </button>
                    )}
                  </div>

                  {/* Bottom Counter badge for mobile/glance */}
                  {hasTasks && (
                    <div className="mt-1 pt-1 border-t border-slate-100/60 flex items-center justify-between text-[10px] text-flow-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {dayTasks.length} tugas
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: SELECTED DAY TASK LIST */}
      <Modal
        isOpen={!!selectedDayKey}
        onClose={() => setSelectedDayKey(null)}
        title={
          selectedDayKey
            ? `Tugas: ${new Date(selectedDayKey).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}`
            : undefined
        }
        description={`Menampilkan ${selectedDayTasks.length} tugas dengan deadline pada tanggal ini.`}
        size="md"
      >
        <div className="space-y-3">
          {selectedDayTasks.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg">
              <p className="text-xs text-flow-muted mb-3">Tidak ada tugas yang jatuh tempo pada tanggal ini.</p>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  const targetDate = selectedDayKey;
                  setSelectedDayKey(null);
                  handleOpenCreate(targetDate || undefined);
                }}
              >
                Jadwalkan Tugas di Tanggal Ini
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {selectedDayTasks.map((task) => {
                  const overdue = isOverdue(task);
                  const statusCfg = STATUS_CONFIG[task.status];

                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedDayKey(null);
                        handleOpenEdit(task);
                      }}
                      className="p-3 rounded-lg border border-flow-border bg-white hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            {statusCfg.label}
                          </span>
                          <Badge variant={PRIORITY_CONFIG[task.priority].variant} size="sm">
                            {PRIORITY_CONFIG[task.priority].label}
                          </Badge>
                          {overdue && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600">
                              <AlertTriangle className="w-3 h-3" /> Terlewat
                            </span>
                          )}
                        </div>
                        <h4
                          className={`text-xs font-bold text-flow-dark truncate ${
                            task.status === 'DONE' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-flow-muted mt-1">
                          <span className="flex items-center gap-1 truncate">
                            <FolderKanban className="w-3 h-3 text-slate-400" />
                            {task.projectName}
                          </span>
                          {task.assignee && (
                            <span>• {task.assignee.name}</span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-flow-border flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDayKey(null)}
                >
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const targetDate = selectedDayKey;
                    setSelectedDayKey(null);
                    handleOpenCreate(targetDate || undefined);
                  }}
                >
                  Tambah Tugas
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* MODAL 2: CREATE TASK */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !isSubmittingCreate && setIsCreateOpen(false)}
        title="Jadwalkan Tugas Baru"
        description="Tambahkan tugas berdeadline ke dalam kalender."
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
              placeholder="Contoh: Evaluasi Sprint Review"
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
              placeholder="Rincian tenggat atau tugas..."
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              maxLength={2000}
              className="w-full px-3 py-2 rounded-lg border border-flow-border bg-white text-xs placeholder:text-slate-400 focus:ring-1 focus:ring-flow-primary focus:outline-none"
            />
          </div>

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
              Simpan ke Kalender
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: EDIT / DETAIL TASK */}
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
                <label className="block text-xs font-semibold text-flow-dark mb-1">Tenggat Waktu (Due Date)</label>
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

      {/* MODAL 4: DELETE CONFIRMATION */}
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
                Ya, Hapus
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
