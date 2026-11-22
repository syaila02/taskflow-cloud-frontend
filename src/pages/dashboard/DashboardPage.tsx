import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  ListTodo,
  Calendar,
  ArrowRight,
  Sparkles,
  Users,
  Activity,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import type { Project } from '@/types/project';
import type { Task } from '@/types/task';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Mengambil data proyek dan tugas aktual dari API backend.
   * Tidak menggunakan data palsu/mock (sesuai instruksi audit AGENTS.md).
   */
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Ambil daftar proyek pengguna (GET /api/v1/projects)
      const projectRes = await projectService.getProjects();
      const userProjects = projectRes.data?.projects || [];
      setProjects(userProjects);

      // 2. Ambil tugas untuk setiap proyek yang diikuti pengguna (GET /api/v1/projects/:id/tasks)
      if (userProjects.length > 0) {
        const taskPromises = userProjects.map((p) =>
          taskService.getProjectTasks(p.id).catch(() => ({ data: { tasks: [] } })),
        );
        const taskResponses = await Promise.all(taskPromises);
        const allTasks: Task[] = taskResponses.flatMap((res) => res.data?.tasks || []);
        setTasks(allTasks);
      } else {
        setTasks([]);
      }
    } catch (err: unknown) {
      const maybeError = err as { message?: string };
      setError(maybeError.message || 'Gagal mengambil data dashboard dari backend');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  // Perhitungan statistik murni dari data riil API
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'DONE').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Tugas dengan batas waktu (deadline) terdekat yang belum selesai
  const upcomingDeadlines = tasks
    .filter((t) => t.dueDate && t.status !== 'DONE')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  // Format tanggal saat ini
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Welcome / Greeting Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-flow-surface via-slate-50 to-blue-50/30 border border-flow-border shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-flow-primary border border-blue-200/60 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace Dashboard</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-flow-dark">
            Selamat datang kembali, {user?.name || 'Anggota Tim'}! 👋
          </h2>

          <p className="text-xs sm:text-sm text-flow-muted">
            {todayFormatted} &bull; Pantau progres proyek dan tenggat waktu tugas Anda secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Muat Ulang
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/projects')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Buka Projects
          </Button>
        </div>
      </div>

      {/* Error Alert jika koneksi ke backend gagal */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <p className="font-semibold mb-1">Gagal Sinkronisasi Data Backend</p>
            <p className="text-rose-700 leading-relaxed">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Projects */}
        <Card hoverable onClick={() => navigate('/projects')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-flow-muted">Total Projects</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-flow-primary flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-flow-dark tracking-tight">{totalProjects}</div>
            )}
            <p className="text-[11px] text-flow-muted mt-1">
              {totalProjects > 0 ? 'Proyek yang Anda ikuti' : 'Belum ada proyek dibuat'}
            </p>
          </CardContent>
          <CardFooter className="justify-between text-[11px]">
            <span>Kelola Workspace</span>
            <ArrowRight className="w-3 h-3 text-flow-muted" />
          </CardFooter>
        </Card>

        {/* Card 2: Total Tasks */}
        <Card hoverable onClick={() => navigate('/projects')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-flow-muted">Total Tasks</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ListTodo className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-flow-dark tracking-tight">{totalTasks}</div>
            )}
            <p className="text-[11px] text-flow-muted mt-1">
              {totalTasks > 0 ? 'Total tugas terdaftar' : 'Belum ada tugas dibuat'}
            </p>
          </CardContent>
          <CardFooter className="justify-between text-[11px]">
            <span>Semua Proyek</span>
            <span className="font-semibold text-flow-dark">{totalProjects} Proyek</span>
          </CardFooter>
        </Card>

        {/* Card 3: Pending / Active Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-flow-muted">Pending Tasks</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-flow-dark tracking-tight">{pendingTasks}</div>
            )}
            <p className="text-[11px] text-flow-muted mt-1">Dalam proses & peninjauan</p>
          </CardContent>
          <CardFooter className="justify-between text-[11px]">
            <span>Status</span>
            <Badge variant="in_progress" size="sm">Aktif</Badge>
          </CardFooter>
        </Card>

        {/* Card 4: Completed Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-flow-muted">Completed Tasks</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-flow-dark tracking-tight">{completedTasks}</div>
            )}
            <p className="text-[11px] text-flow-muted mt-1">Tugas berhasil diselesaikan</p>
          </CardContent>
          <CardFooter className="justify-between text-[11px]">
            <span>Progres Penyelesaian</span>
            <span className="font-semibold text-emerald-600">{completionRate}%</span>
          </CardFooter>
        </Card>
      </div>

      {/* 3. Task Progress Bar Section */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-flow-primary" />
              <span className="text-xs font-semibold text-flow-dark">Tingkat Penyelesaian Tugas Workspace</span>
            </div>
            <span className="text-xs font-bold text-flow-primary">{completionRate}% Selesai</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-flow-primary h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>

          <p className="text-[11px] text-flow-muted mt-2">
            {totalTasks > 0
              ? `${completedTasks} dari ${totalTasks} tugas telah selesai dikerjakan.`
              : 'Belum ada tugas terdaftar di proyek Anda. Progres akan otomatis dihitung saat tugas ditambahkan.'}
          </p>
        </CardContent>
      </Card>

      {/* 4. Two-Column Layout: Proyek Terkini & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri (8 Kolom): Daftar Proyek Terkini */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-flow-dark tracking-tight">Proyek Terkini</h3>
              <p className="text-xs text-flow-muted">Daftar proyek aktif yang Anda miliki atau ikuti</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/projects')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Lihat Semua
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {projects.slice(0, 4).map((project) => (
                <Card
                  key={project.id}
                  hoverable
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-flow-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-flow-dark hover:text-flow-primary transition-colors">
                          {project.name}
                        </h4>
                        <p className="text-xs text-flow-muted line-clamp-1 mt-0.5">
                          {project.description || 'Tidak ada deskripsi proyek'}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-flow-muted mt-2">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            {project._count?.members || 1} Anggota
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <ListTodo className="w-3 h-3 text-slate-400" />
                            {project._count?.tasks || 0} Tugas
                          </span>
                        </div>
                      </div>
                    </div>

                    <Badge variant={project.currentUserRole === 'OWNER' ? 'primary' : 'neutral'} size="sm">
                      {project.currentUserRole || 'MEMBER'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <EmptyState
                  icon={<FolderKanban className="w-6 h-6 text-flow-primary" />}
                  title="Belum Ada Proyek"
                  description="Workspace Anda masih kosong. Buat proyek pertama Anda untuk mulai mengatur alur kerja dan membagi tugas tim."
                  action={
                    <Button size="sm" onClick={() => navigate('/projects')}>
                      Buat Proyek Pertama
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Kolom Kanan (5 Kolom): Upcoming Deadlines */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-flow-dark tracking-tight">Tenggat Waktu</h3>
              <p className="text-xs text-flow-muted">Tugas aktif mendekati deadline</p>
            </div>
            <Badge variant="neutral" size="sm">
              {upcomingDeadlines.length} Tugas
            </Badge>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : upcomingDeadlines.length > 0 ? (
            <div className="space-y-2.5">
              {upcomingDeadlines.map((task) => (
                <Card key={task.id} className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-semibold text-flow-dark line-clamp-1">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-flow-muted mt-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>
                          {task.dueDate
                            ? new Intl.DateTimeFormat('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }).format(new Date(task.dueDate))
                            : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge
                        variant={
                          task.priority === 'URGENT'
                            ? 'urgent'
                            : task.priority === 'HIGH'
                            ? 'high'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <EmptyState
                  icon={<Calendar className="w-6 h-6 text-flow-muted" />}
                  title="Tidak Ada Deadline Terdekat"
                  description="Semua tugas berada dalam kendali atau belum memiliki deadline yang ditentukan."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 5. Server Activity / Log Section (Jujur sesuai data backend) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Riwayat Aktivitas Workspace</CardTitle>
          <CardDescription>
            Pencatatan riwayat perubahan data dan aktivitas tim
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Activity className="w-6 h-6 text-flow-muted" />}
            title="Log Aktivitas Belum Tersedia"
            description="Pencatatan riwayat audit dan log aktivitas otomatis akan diaktifkan setelah endpoint activity logging disediakan oleh backend."
          />
        </CardContent>
      </Card>
    </div>
  );
};
