
import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Users,
  ArrowRight,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

export const ProjectListPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProjectName('');
    setDescription('');
  };

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

        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Project
        </Button>
      </div>

      {/* Project Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-flow-primary flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-flow-muted">
                Total Projects
              </p>
              <p className="text-lg font-bold text-flow-dark">
                --
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
              <p className="text-xs text-flow-muted">
                Total Members
              </p>
              <p className="text-lg font-bold text-flow-dark">
                --
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
            >
              Batal
            </Button>
            <Button disabled={!projectName.trim()}>
              Simpan Proyek
              <ArrowRight className="w-4 h-4" />
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
