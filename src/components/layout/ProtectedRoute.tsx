import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
  redirectPath?: string;
  /** Izinkan akses preview saat pengembangan Tahap 2 */
  allowPreview?: boolean;
}

/**
 * Komponen pelindung rute privat.
 * Pada Tahap 3, komponen ini akan terhubung langsung dengan AuthContext.
 * Untuk Tahap 2, disiapkan kerangka pengecekan token dengan opsi bypass untuk preview.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectPath = '/login',
  allowPreview = true,
}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('taskflow_token') : null;

  // Jika bypass preview aktif atau token ditemukan, izinkan akses ke workspace
  if (allowPreview || token) {
    return children ? <>{children}</> : <Outlet />;
  }

  return <Navigate to={redirectPath} replace />;
};
