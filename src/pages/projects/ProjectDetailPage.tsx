import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  List,
  Kanban,
  CalendarDays,
  FolderKanban,
  Plus,
  UserPlus,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
} from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

type ViewMode = 'table' | 'kanban' | 'calendar';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeView, setActiveView] = useState<ViewMode>('table');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const tabs = [
    { id: 'table' as ViewMode, label: 'Table View', icon: List },
    { id: 'kanban' as ViewMode, label: 'Kanban Board', icon: Kanban },
    { id: 'calendar' as ViewMode, label: 'Calendar', icon: CalendarDays },
  ];

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
            Project Detail
          </h2>

          <p className="text-sm text-flow-muted mt-1">
            Kelola tugas dan aktivitas dalam proyek ini.
          </p>

          <p className="text-xs text-flow-muted mt-2">
            Project ID: {projectId}
          </p>
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
              Informasi nama, deskripsi, dan role anggota akan ditampilkan
              setelah data proyek terhubung dengan backend.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* View Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-flow-border pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          

          return (
            <Button
              key={tab.id}
              size="sm"
              variant={isActive ? 'primary' : 'outline'}
              onClick={() => setActiveView(tab.id)}
              leftIcon={<Icon className="w-4 h-4" />}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Table View */}
      {activeView === 'table' && (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-flow-border text-flow-muted">
                    <th className="py-3 px-3 font-semibold">Task</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-3 font-semibold">Priority</th>
                    <th className="py-3 px-3 font-semibold">Assignee</th>
                    <th className="py-3 px-3 font-semibold">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-flow-muted">
                      Belum ada data tugas. Data akan ditampilkan setelah
                      terhubung dengan backend.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban View */}
      {activeView === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { title: 'Todo', color: 'bg-slate-100' },
            { title: 'In Progress', color: 'bg-blue-50' },
            { title: 'Review', color: 'bg-amber-50' },
            { title: 'Done', color: 'bg-emerald-50' },
          ].map((column) => (
            <div
              key={column.title}
              className="rounded-xl border border-flow-border bg-flow-surface p-3 min-h-48"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-flow-dark">
                  {column.title}
                </h3>
                <span className="text-xs text-flow-muted">0</span>
              </div>

              <div className={`${column.color} rounded-lg p-4 text-center`}>
                <p className="text-xs text-flow-muted">
                  Belum ada tugas
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendar View */}
      {activeView === 'calendar' && (
        <Card>
          <CardContent>
            <EmptyState
              icon={<CalendarDays className="w-6 h-6 text-flow-primary" />}
              title="Kalender belum tersedia"
              description="Deadline tugas akan ditampilkan dalam kalender setelah data tugas tersedia."
            />
          </CardContent>
        </Card>
      )}
      {/* Add Task Modal */}
        <Modal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            title="Tambah Tugas Baru"
            description="Masukkan informasi tugas yang akan dikerjakan."
            size="lg"
            footer={
                <>
                <Button
                    variant="outline"
                    onClick={() => setIsTaskModalOpen(false)}
                >
                    Batal
                </Button>

                <Button disabled>
                    Simpan Tugas
                </Button>
                </>
            }
            >
            <div className="space-y-4">
                <Input
                label="Judul Tugas"
                placeholder="Contoh: Membuat desain halaman login"
                />

                <div>
                <label className="block text-xs font-semibold text-flow-dark mb-1.5">
                    Deskripsi
                </label>
                <textarea
                    rows={3}
                    placeholder="Jelaskan detail tugas..."
                    className="w-full rounded-lg border border-flow-border bg-flow-surface px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-flow-primary"
                />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-flow-dark mb-1.5">
                    Status
                    </label>
                    <select className="w-full rounded-lg border border-flow-border bg-flow-surface px-3 py-2 text-sm">
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
                    <select className="w-full rounded-lg border border-flow-border bg-flow-surface px-3 py-2 text-sm">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                    </select>
                </div>
                </div>

                <Input
                label="Assignee"
                placeholder="Nama atau email anggota tim"
                />

                <Input
                label="Deadline"
                type="date"
                />

                <p className="text-xs text-flow-muted">
                Penyimpanan tugas akan diaktifkan setelah API backend tersedia.
                </p>
            </div>
        </Modal>
        {/* Invite Team Modal */}
        <Modal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            title="Undang Anggota Tim"
            description="Undang anggota baru untuk bergabung ke proyek ini."
            size="md"
            footer={
                <>
                <Button
                    variant="outline"
                    onClick={() => setIsInviteModalOpen(false)}
                >
                    Batal
                </Button>

                <Button disabled>
                    Kirim Undangan
                </Button>
                </>
            }
            >
            <div className="space-y-4">
                <Input
                label="Email Anggota"
                type="email"
                placeholder="nama@email.com"
                />

                <div>
                <label className="block text-xs font-semibold text-flow-dark mb-1.5">
                    Role Anggota
                </label>

                <select className="w-full rounded-lg border border-flow-border bg-flow-surface px-3 py-2 text-sm">
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                </select>
                </div>

                <p className="text-xs text-flow-muted">
                Pengiriman undangan akan diaktifkan setelah API backend tersedia.
                </p>
            </div>
        </Modal>
    </div>
  );
};
