import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { WorkspacePreview } from '@/pages/dashboard/WorkspacePreview';
import { MyTasksPage } from '@/pages/tasks/MyTasksPage';
import { BoardPage } from '@/pages/board/BoardPage';
import { ModulePlaceholder } from '@/pages/ModulePlaceholder';
import { ProjectListPage } from '@/pages/projects/ProjectListPage';
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Publik Autentikasi */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rute Utama Workspace TaskFlow Cloud */}
        <Route
          element={
            <ProtectedRoute allowPreview={true}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard Utama (Fungsional dengan integrasi data backend riil) */}
          <Route path="/" element={<DashboardPage />} />

          {/* Rute Preview Showcase Komponen (Tahap 2) tetap dipertahankan */}
          <Route path="/preview" element={<WorkspacePreview />} />

          {/* My Tasks — Manajemen Seluruh Tugas User */}
          <Route path="/tasks" element={<MyTasksPage />} />
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          {/* Board — Kanban Workflow Visual */}
          <Route path="/board" element={<BoardPage />} />
          <Route path="/calendar" element={<ModulePlaceholder />} />
          <Route path="/team" element={<ModulePlaceholder />} />
          <Route path="/settings" element={<ModulePlaceholder />} />

          {/* Catch-all 404 / Unmatched Route */}
          <Route path="*" element={<ModulePlaceholder />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
