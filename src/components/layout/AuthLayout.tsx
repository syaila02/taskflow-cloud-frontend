import React, { ReactNode } from 'react';
import { Layers, CheckCircle2, Shield, Sparkles } from 'lucide-react';

export interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-flow-canvas flex flex-col lg:grid lg:grid-cols-12 text-flow-dark">
      {/* Kolom Kiri: Visual Showcase Branding (Desktop only) */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 bg-flow-dark text-white p-12 flex-col justify-between relative overflow-hidden select-none">
        {/* Subtle Background Glow Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-flow-primary/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-flow-primary flex items-center justify-center text-white shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">TaskFlow Cloud</h1>
            <p className="text-xs text-slate-400">Workspace & Project Management SaaS</p>
          </div>
        </div>

        {/* Middle: Value Proposition */}
        <div className="space-y-6 relative z-10 my-auto py-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-400/20 text-blue-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modern Workspace Platform</span>
          </div>

          <h2 className="text-2xl xl:text-3xl font-bold leading-tight tracking-tight text-white">
            Kelola proyek, alur tugas, dan kolaborasi tim dalam satu platform.
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed max-w-md">
            Dirancang dengan estetika minimalis Notion dan kecepatan eksekusi Linear untuk produktivitas maksimal tim Anda.
          </p>

          <div className="space-y-3.5 pt-4">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Manajemen tugas fleksibel dengan Table View & Kanban Board</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Isolasi data proyek dan sistem hak akses berbasis role (RBAC)</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span>Infrastruktur aman dengan enkripsi password bcrypt dan JWT</span>
            </div>
          </div>
        </div>

        {/* Bottom: Footer Info */}
        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 relative z-10">
          TaskFlow Cloud &copy; 2026 — Praktikum Komputasi Awan
        </div>
      </div>

      {/* Kolom Kanan: Form Authentication */}
      <div className="flex-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-flow-primary flex items-center justify-center text-white shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-flow-dark">TaskFlow Cloud</span>
          </div>

          {/* Form Header */}
          <div className="text-center sm:text-left space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-flow-dark">{title}</h2>
            <p className="text-xs sm:text-sm text-flow-muted leading-relaxed">{subtitle}</p>
          </div>

          {/* Form Card Content */}
          <div className="bg-flow-surface rounded-2xl border border-flow-border p-6 sm:p-8 shadow-sm">
            {children}
          </div>

          {/* Micro Footer */}
          <p className="text-center text-xs text-flow-muted">
            Dengan melanjutkan, Anda menyetujui ketentuan penggunaan TaskFlow Cloud SaaS.
          </p>
        </div>
      </div>
    </div>
  );
};
