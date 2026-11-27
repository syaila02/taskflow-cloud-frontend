
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  List,
  Kanban,
  CalendarDays,
  FolderKanban,
  Plus,
  UserPlus,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { teamService } from '@/services/team.service';
import type { Project } from '@/types/project';
import type { Task, TaskStatus, TaskPriority } from '@/types/task';

type ViewMode = 'table' | 'kanban' | 'calendar';

const statusLabels: Record<TaskStatus, string> = {
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeView, setActiveView] = useState<ViewMode>('table');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [isInviting, setIsInviting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const tabs = [
    { id: 'table' as ViewMode, label: 'Table View', icon: List },
    { id: 'kanban' as ViewMode, label: 'Kanban Board', icon: Kanban },
    { id: 'calendar' as ViewMode, label: 'Calendar', icon: CalendarDays },
  ];

  const fetchProjectData = async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError('');

      const [projectResponse, taskResponse] = await Promise.all([
        projectService.getProjectDetail(projectId),
        taskService.getProjectTasks(projectId),
      ]);

      setProject(projectResponse.data.project);
      setTasks(taskResponse.data.tasks);
    } catch (err) {
      console.error('Gagal mengambil data proyek:', err);
      setError('Gagal memuat data proyek atau tugas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const handleEditTask = (task: Task) => {
    setSelectedTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
    setIsTaskModalOpen(true);
  };
  const handleCreateTask = async () => {
    if (!projectId || !title.trim()) return;

    try {
      setIsSaving(true);
      setError('');

      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
      };

      if (selectedTaskId) {
        await taskService.updateTask(selectedTaskId, taskData);
      } else {
        await taskService.createTask(projectId, taskData);
      }

      setTitle('');
      setDescription('');
      setStatus('TODO');
      setPriority('MEDIUM');
      setDueDate('');
      setSelectedTaskId(null);
      setIsTaskModalOpen(false);

      await fetchProjectData();
    } catch (err) {
      console.error('Gagal menyimpan tugas:', err);
      setError('Gagal menyimpan tugas. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const confirmed = window.confirm(
      'Apakah kamu yakin ingin menghapus tugas ini?'
    );

    if (!confirmed) return;

    try {
      setError('');

      await taskService.deleteTask(taskId);

      await fetchProjectData();
    } catch (err) {
      console.error('Gagal menghapus tugas:', err);
      setError('Gagal menghapus tugas. Silakan coba lagi.');
    }
  };

  const handleInviteTeam = async () => {
    if (!projectId || !inviteEmail.trim()) return;

    try {
      setIsInviting(true);
      setError('');
      setSuccessMessage('');

      await teamService.createInvitation(projectId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      setSuccessMessage('Undangan berhasil dikirim.');
      setInviteEmail('');
      setInviteRole('MEMBER');
      setIsInviteModalOpen(false);

      await fetchProjectData();
    } catch (err) {
      console.error('Gagal mengirim undangan:', err);
      setError('Gagal mengirim undangan. Silakan coba lagi.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-flow-muted mb-2">
            <FolderKanban className="w-4 h-4" />
            <span>Projects</span>
            <span>/</span>
            <span>Project Detail</span>
          </div>

          <h2 className="text-2xl font-bold text-flow-dark">
            {project?.name ?? 'Project Detail'}
          </h2>

          <p className="text-sm text-flow-muted mt-1">
            {project?.description || 'Kelola tugas dan aktivitas dalam proyek ini.'}
          </p>

          {project && (
            <p className="text-xs text-flow-muted mt-2">
              Role: {project.currentUserRole ?? 'Member'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setIsInviteModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Invite Team
          </Button>

          <Button
            onClick={() => setIsTaskModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Task
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Project Information */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-flow-primary flex items-center justify-center">
            <FolderKanban className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-semibold text-flow-dark">
              Informasi Proyek
            </h3>
            <p className="text-sm text-flow-muted mt-1">
              {isLoading
                ? 'Memuat informasi proyek...'
                : `${project?._count?.members ?? 0} anggota dan ${tasks.length} tugas`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* View Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-flow-border pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <Button
              key={tab.id}
              size="sm"
              variant={activeView === tab.id ? 'primary' : 'outline'}
              onClick={() => setActiveView(tab.id)}
              leftIcon={<Icon className="w-4 h-4" />}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      {isLoading ? (
        <Card>
          <CardContent>
            <p className="py-8 text-center text-sm text-flow-muted">
              Memuat data tugas...
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Table View */}
          {activeView === 'table' && (
            <Card>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-flow-border text-flow-muted">
                        <th className="py-3 px-3">Task</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Priority</th>
                        <th className="py-3 px-3">Assignee</th>
                        <th className="py-3 px-3">Deadline</th>
                        <th className="py-3 px-3">Aksi</th>
                      </tr>
                    </thead>

                    <tbody>
                      {tasks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-flow-muted">
                            Belum ada tugas dalam proyek ini.
                          </td>
                        </tr>
                      ) : (
                        tasks.map((task) => (
                          <tr key={task.id} className="border-b border-flow-border">
                            <td className="py-3 px-3 font-medium text-flow-dark">
                              {task.title}
                            </td>
                            <td className="py-3 px-3">
                              {statusLabels[task.status]}
                            </td>
                            <td className="py-3 px-3">
                              {priorityLabels[task.priority]}
                            </td>
                            <td className="py-3 px-3">
                              {task.assignee?.name ?? '-'}
                            </td>
                            <td className="py-3 px-3">
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString('id-ID')
                                : '-'}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleEditTask(task)}
                                  className="text-flow-primary hover:underline font-medium"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-red-600 hover:underline font-medium"
                                >
                                  <Trash2 className="w-4 h-4 inline mr-1" />
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Kanban View */}
          {activeView === 'kanban' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as TaskStatus[]).map((columnStatus) => {
                const columnTasks = tasks.filter(
                  (task) => task.status === columnStatus
                );

                return (
                  <div
                    key={columnStatus}
                    className="rounded-xl border border-flow-border bg-flow-surface p-3 min-h-48"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm text-flow-dark">
                        {statusLabels[columnStatus]}
                      </h3>
                      <span className="text-xs text-flow-muted">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {columnTasks.length === 0 ? (
                        <div className="rounded-lg bg-slate-100 p-4 text-center text-xs text-flow-muted">
                          Belum ada tugas
                        </div>
                      ) : (
                        columnTasks.map((task) => (
                          <div
                            key={task.id}
                            className="rounded-lg border border-flow-border bg-white p-3"
                          >
                            <p className="text-sm font-medium text-flow-dark">
                              {task.title}
                            </p>
                            <p className="mt-2 text-xs text-flow-muted">
                              {priorityLabels[task.priority]}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Calendar View */}
          {activeView === 'calendar' && (
            <Card>
              <CardContent>
                {tasks.filter((task) => task.dueDate).length === 0 ? (
                  <EmptyState
                    icon={<CalendarDays className="w-6 h-6 text-flow-primary" />}
                    title="Belum ada deadline"
                    description="Tugas yang memiliki deadline akan ditampilkan di sini."
                  />
                ) : (
                  <div className="space-y-3">
                    {tasks
                      .filter((task) => task.dueDate)
                      .sort((a, b) =>
                        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
                      )
                      .map((task) => (
                        <div
                          key={task.id}
                          className="flex flex-col sm:flex-row sm:justify-between gap-2 border-b border-flow-border pb-3"
                        >
                          <span className="font-medium text-flow-dark">
                            {task.title}
                          </span>
                          <span className="text-sm text-flow-muted">
                            {new Date(task.dueDate!).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => !isSaving && setIsTaskModalOpen(false)}
        title={selectedTaskId ? 'Edit Tugas' : 'Tambah Tugas Baru'}
        description="Masukkan informasi tugas yang akan dikerjakan."
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsTaskModalOpen(false)}
              disabled={isSaving}
            >
              Batal
            </Button>

            <Button
              onClick={handleCreateTask}
              disabled={!title.trim() || isSaving}
            >
              {isSaving
                ? 'Menyimpan...'
                : selectedTaskId
                  ? 'Simpan Perubahan'
                  : 'Simpan Tugas'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Judul Tugas"
            placeholder="Contoh: Membuat desain halaman login"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-flow-dark mb-1.5">
              Deskripsi
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan detail tugas..."
              className="w-full rounded-lg border border-flow-border bg-flow-surface px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-flow-dark mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-lg border border-flow-border bg-flow-surface px-3 py-2 text-sm"
              >
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-flow-dark mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-lg border border-flow-border bg-flow-surface px-3 py-2 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <Input
            label="Deadline"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </Modal>

      {/* Invite Team Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => !isInviting && setIsInviteModalOpen(false)}
        title="Undang Anggota Tim"
        description="Undang anggota baru untuk bergabung ke proyek ini."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsInviteModalOpen(false)}
              disabled={isInviting}
            >
              Batal
            </Button>

            <Button
              onClick={handleInviteTeam}
              disabled={!inviteEmail.trim() || isInviting}
            >
              {isInviting ? 'Mengirim...' : 'Kirim Undangan'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Email Anggota"
            type="email"
            placeholder="nama@email.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-flow-dark mb-1.5">
              Role Anggota
            </label>

            <select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as 'ADMIN' | 'MEMBER')
              }
              className="w-full rounded-lg border border-flow-border bg-flow-surface px-3 py-2 text-sm"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
