import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { WorkspacePreview } from '@/pages/dashboard/WorkspacePreview';
import { ModulePlaceholder } from '@/pages/ModulePlaceholder';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Utama Workspace TaskFlow Cloud */}
        <Route
          element={
            <ProtectedRoute allowPreview={true}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Landing Overview Workspace Preview (Tahap 2) */}
          <Route path="/" element={<WorkspacePreview />} />

          {/* Rute Modul Berikutnya (ditangani dengan graceful placeholder) */}
          <Route path="/tasks" element={<ModulePlaceholder />} />
          <Route path="/projects" element={<ModulePlaceholder />} />
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
