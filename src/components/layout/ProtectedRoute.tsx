import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
  redirectPath?: string;
  /** Izinkan akses preview saat pengembangan */
  allowPreview?: boolean;
}

/**
 * Komponen pelindung rute privat berbasis session AuthContext.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectPath = '/login',
  allowPreview = true,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Tampilkan loading screen bersih saat memvalidasi sesi awal
  if (isLoading) {
    return (
      <div className="min-h-screen bg-flow-canvas flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-flow-muted font-medium">Memuat workspace...</p>
      </div>
    );
  }

  // Jika bypass preview aktif atau user sudah login, izinkan akses ke workspace
  if (allowPreview || isAuthenticated) {
    return children ? <>{children}</> : <Outlet />;
  }

  return <Navigate to={redirectPath} replace />;
};
