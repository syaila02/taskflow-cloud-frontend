import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Menu, Search, Bell, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { env } from '@/config/env';

export interface HeaderProps {
  onMobileMenuOpen: () => void;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onMobileMenuOpen,
  title = 'Overview Workspace',
  subtitle,
}) => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const backendRoot = env.apiUrl.replace(/\/api\/v1\/?$/, '');
    axios
      .get(`${backendRoot}/health`, { timeout: 3000 })
      .then((res) => {
        if (res.data?.success) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      })
      .catch(() => {
        setBackendStatus('offline');
      });
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 md:px-8 bg-flow-surface/90 backdrop-blur-md border-b border-flow-border transition-colors">
      {/* Left: Mobile Toggle & Title/Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 rounded-lg text-flow-muted hover:text-flow-dark hover:bg-slate-100 transition-colors"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-flow-dark">
              {title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-flow-primary border border-blue-200/60">
              <Sparkles className="w-2.5 h-2.5" />
              v0.1.0 Preview
            </span>
          </div>
          {subtitle && (
            <p className="text-xs text-flow-muted hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Backend Live Indicator, Quick Search, Notifications & User */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Indikator Status Koneksi Backend Real-time */}
        {backendStatus === 'checking' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
            Cek Backend...
          </span>
        )}
        {backendStatus === 'online' && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
            title="Backend aktif di localhost:3000"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Backend Aktif
          </span>
        )}
        {backendStatus === 'offline' && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
            title="Backend belum menyala. Jalankan 'npm run dev' di folder backend"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Backend Offline
          </span>
        )}

        {/* Quick Search Trigger Bar (Visual Notion/Linear shortcut) */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-flow-border bg-slate-50 text-flow-muted text-xs cursor-pointer hover:border-slate-300 transition-colors w-40 md:w-52">
          <Search className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
          <span className="flex-1 truncate text-slate-400">Cari tugas, proyek...</span>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] text-slate-400 font-mono">
            ⌘K
          </kbd>
        </div>

        {/* Notification Icon */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-flow-muted hover:text-flow-dark hover:bg-slate-100 transition-colors"
          title="Notifikasi"
          aria-label="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-flow-primary" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-flow-border mx-1" />

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2 pl-1 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-flow-primary to-blue-400 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
            TF
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-flow-dark leading-none">Developer</span>
            <span className="text-[10px] text-flow-muted leading-none mt-1">Admin Preview</span>
          </div>
        </div>
      </div>
    </header>
  );
};
