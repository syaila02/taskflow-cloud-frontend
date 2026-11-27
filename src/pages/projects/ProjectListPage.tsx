
import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  Plus,
  Users,
  ArrowRight,
  CalendarDays,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

import { projectService } from '@/services/project.service';
import type { Project } from '@/types/project';

export const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await projectService.getProjects();
      setProjects(response.data.projects);
    } catch (err) {
      console.error('Gagal mengambil proyek:', err);
      setError('Gagal memuat daftar proyek. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCloseModal = () => {
    if (isSaving) return;

    setIsModalOpen(false);
    setProjectName('');
    setDescription('');
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;

    try {
      setIsSaving(true);
      setError('');

      await projectService.createProject({
        name: projectName.trim(),
        description: description.trim() || undefined,
      });

      handleCloseModal();
      await fetchProjects();
    } catch (err) {
      console.error('Gagal membuat proyek:', err);
      setError('Gagal membuat proyek. Periksa koneksi dan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalMembers = projects.reduce(
    (total, project) => total + (project._count?.members ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-flow-dark">
            My Projects
          </h2>
          <p className="text-sm text-flow-muted mt-1">
            Kelola dan pantau semua proyek dalam workspace kamu.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchProjects}
            disabled={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Project
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Project Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-flow-primary flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-flow-muted">Total Projects</p>
              <p className="text-lg font-bold text-flow-dark">
                {isLoading ? '...' : projects.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-flow-muted">Total Members</p>
              <p className="text-lg font-bold text-flow-dark">
                {isLoading ? '...' : totalMembers}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project List */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-flow-dark">
            All Projects
          </h3>
          <p className="text-xs text-flow-muted mt-1">
            Daftar proyek yang kamu ikuti.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-flow-border p-8 text-center text-sm text-flow-muted">
            Memuat daftar proyek...
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="w-6 h-6 text-flow-primary" />}
            title="Belum ada proyek"
            description="Proyek yang kamu buat atau ikuti akan muncul di sini. Mulai dengan membuat proyek baru."
            action={
              <Button
                size="sm"
                onClick={() => setIsModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Buat Proyek Pertama
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-flow-primary flex items-center justify-center">
                      <FolderKanban className="w-5 h-5" />
                    </div>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-flow-primary">
                      {project.currentUserRole ?? 'MEMBER'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-flow-dark">
                      {project.name}
                    </h4>
                    <p className="mt-1 text-sm text-flow-muted line-clamp-2">
                      {project.description || 'Tidak ada deskripsi proyek.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-flow-muted">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {project._count?.members ?? 0} Members
                    </span>

                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" />
                      {new Date(project.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <Button
                      variant="outline"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      className="w-full"
                  >
                    Lihat Proyek
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Buat Proyek Baru"
        description="Masukkan informasi dasar untuk proyek baru kamu."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={isSaving}
            >
              Batal
            </Button>

            <Button
              onClick={handleCreateProject}
              disabled={!projectName.trim() || isSaving}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Proyek'}
              {!isSaving && <ArrowRight className="w-4 h-4" />}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nama Proyek"
            placeholder="Contoh: Website Development"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />

          <div>
            <label
              htmlFor="project-description"
              className="block text-xs font-semibold text-flow-dark mb-1.5"
            >
              Deskripsi Proyek
            </label>

            <textarea
              id="project-description"
              rows={4}
              placeholder="Jelaskan tujuan proyek..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-flow-border bg-flow-surface px-3 py-2 text-sm text-flow-dark focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-flow-primary resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
