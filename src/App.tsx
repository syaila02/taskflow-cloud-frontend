import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { WorkspacePreview } from '@/pages/dashboard/WorkspacePreview';
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

          {/* Rute Modul Berikutnya (ditangani dengan graceful placeholder) */}
          <Route path="/tasks" element={<ModulePlaceholder />} />
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/board" element={<ModulePlaceholder />} />
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
