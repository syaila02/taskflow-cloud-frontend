import React, { useState } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  ListTodo,
  Plus,
  Sparkles,
  Info,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';

export const WorkspacePreview: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBtnLoading, setIsBtnLoading] = useState(false);

  const handleTestLoading = () => {
    setIsBtnLoading(true);
    setTimeout(() => setIsBtnLoading(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-flow-surface to-slate-50 border border-flow-border shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-flow-primary border border-blue-200/60 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace Preview — Tahap 2 Aktif</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-flow-dark">
            Selamat datang di TaskFlow Cloud Workspace
          </h2>
          <p className="text-xs md:text-sm text-flow-muted max-w-2xl">
            Kerangka antarmuka modern terinspirasi Notion & Linear dengan identitas visual khas TaskFlow.
            Halaman ini menampilkan integrasi Core Design System dan App Layout.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          >
            Uji Modal Dialog
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleTestLoading}
            isLoading={isBtnLoading}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Uji Interaksi Tombol
          </Button>
        </div>
      </div>

      {/* 2. Notice / Honest Status Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900 leading-relaxed">
        <Info className="w-4 h-4 text-flow-primary flex-shrink-0 mt-0.5" />
        <p>
          <strong className="font-semibold text-flow-primary">Status Integrasi:</strong> Kartu metrik di bawah ini disiapkan sebagai kerangka antarmuka (UI scaffolding). Sesuai batasan AGENTS.md, kami <strong>tidak menggunakan data fiktif (mock data)</strong>. Data riil proyek dan tugas akan terhubung pada Tahap 4 & 5 setelah backend API diselesaikan.
        </p>
      </div>

      {/* 3. Placeholder Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <Card hoverable>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-flow-muted">Total Projects</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-flow-primary flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-flow-dark tracking-tight">0</div>
            <p className="text-[11px] text-flow-muted mt-1">Belum ada proyek dibuat</p>
          </CardContent>
          <CardFooter className="justify-between text-[11px]">
            <span>Menunggu integrasi API</span>
            <Badge variant="neutral" size="sm">Tahap 5</Badge>
          </CardFooter>
        </Card>

        {/* Metric 2 */}
        <Card hoverable>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-flow-muted">Active Tasks</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ListTodo className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-flow-dark tracking-tight">0</div>
            <p className="text-[11px] text-flow-muted mt-1">Belum ada tugas aktif</p>
          </CardContent>
          <CardFooter className="justify-between text-[11px]">
            <span>Menunggu integrasi API</span>
            <Badge variant="neutral" size="sm">Tahap 5</Badge>
          </CardFooter>
        </Card>

        {/* Metric 3 */}
        <Card hoverable>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-flow-muted">Completed Tasks</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-flow-dark tracking-tight">0</div>
            <p className="text-[11px] text-flow-muted mt-1">Tugas selesai minggu ini</p>
          </CardContent>
          <CardFooter className="justify-between text-[11px]">
            <span>Menunggu integrasi API</span>
            <Badge variant="neutral" size="sm">Tahap 5</Badge>
          </CardFooter>
        </Card>
      </div>

      {/* 4. Getting Started & Recent Activity (Empty State) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity (Empty State) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Aktivitas Terkini</CardTitle>
                <CardDescription>Log riwayat aktivitas tugas dan proyek</CardDescription>
              </div>
              <Badge variant="neutral" size="sm">Real-time log</Badge>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<Layers className="w-6 h-6 text-flow-muted" />}
                title="Belum Ada Aktivitas"
                description="Workspace baru saja diinisialisasi. Aktivitas tim dan pembaruan tugas akan muncul secara otomatis di sini saat backend terhubung."
                action={
                  <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                    Pelajari Alur Kerja
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Design System Token Showcase */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Design System Badges</CardTitle>
              <CardDescription>Visual token status & prioritas tugas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-flow-muted uppercase tracking-wider mb-2">
                  Status Tugas (TaskStatus Enum)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="todo" hasDot>TODO</Badge>
                  <Badge variant="in_progress" hasDot>IN PROGRESS</Badge>
                  <Badge variant="review" hasDot>REVIEW</Badge>
                  <Badge variant="done" hasDot>DONE</Badge>
                </div>
              </div>

              <div className="pt-2 border-t border-flow-border/60">
                <p className="text-[11px] font-semibold text-flow-muted uppercase tracking-wider mb-2">
                  Prioritas Tugas (TaskPriority Enum)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="low">LOW</Badge>
                  <Badge variant="medium">MEDIUM</Badge>
                  <Badge variant="high">HIGH</Badge>
                  <Badge variant="urgent">URGENT</Badge>
                </div>
              </div>

              <div className="pt-2 border-t border-flow-border/60">
                <p className="text-[11px] font-semibold text-flow-muted uppercase tracking-wider mb-2">
                  Indikator Loading & Skeleton
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 5. Reusable Components Interactive Playground */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Komponen Form & Button Primitives</CardTitle>
          <CardDescription>Pengujian variasi tombol dan input fields yang telah dibuat di Tahap 2</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Button Variants */}
          <div>
            <p className="text-xs font-semibold text-flow-dark mb-2">Variasi Tombol:</p>
            <div className="flex flex-wrap gap-2.5">
              <Button variant="primary" size="sm">Primary Button</Button>
              <Button variant="secondary" size="sm">Secondary</Button>
              <Button variant="outline" size="sm">Outline</Button>
              <Button variant="ghost" size="sm">Ghost</Button>
              <Button variant="danger" size="sm">Danger</Button>
              <Button variant="primary" size="sm" isLoading>Loading</Button>
            </div>
          </div>

          {/* Input Primitives */}
          <div className="pt-3 border-t border-flow-border/60 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contoh Input Normal"
              placeholder="Ketik sesuatu..."
              helperText="Helper text informatif di bawah input"
            />
            <Input
              label="Contoh Input Validasi Error"
              placeholder="contoh@domain.com"
              defaultValue="format-salah"
              error="Format email tidak valid (simulasi error)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reusable Modal Dialog Test */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Uji Reusable Modal TaskFlow"
        description="Dialog modal berbasis aksesibilitas dengan dukungan backdrop blur, keyboard ESC, dan tombol aksi."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
              Selesai Uji Coba
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-flow-muted leading-relaxed">
            Komponen modal ini siap digunakan pada Tahap 4-6 untuk form pembuatan proyek baru, penambahan tugas, dan pengiriman undangan anggota tim.
          </p>
          <Input
            label="Nama Proyek / Tugas Contoh"
            placeholder="Misal: Redesign Landing Page"
            helperText="Input ini dapat disematkan langsung di dalam Modal"
          />
        </div>
      </Modal>
    </div>
  );
};
