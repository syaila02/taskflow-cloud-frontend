import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { env } from '@/config/env';
import { CheckCircle2, AlertCircle, Layers, Server, ArrowRight } from 'lucide-react';

interface HealthData {
  status: string;
  uptime: number;
}

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mengecek konektivitas ke backend endpoint /health (AGENTS.md §8 & §12.3)
    const backendRoot = env.apiUrl.replace(/\/api\/v1\/?$/, '');
    axios
      .get(`${backendRoot}/health`, { timeout: 3000 })
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setHealth(res.data.data as HealthData);
        }
      })
      .catch((err) => {
        setHealthError(err.message || 'Gagal terhubung ke backend server');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-flow-canvas text-flow-dark flex flex-col justify-between p-6 md:p-12">
      {/* Header / Brand */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-8 border-b border-flow-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-flow-primary flex items-center justify-center text-white shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-flow-dark">TaskFlow Cloud</h1>
            <p className="text-xs text-flow-muted">Workspace & Project Management SaaS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white border border-flow-border text-flow-dark shadow-sm">
            <span className="w-2 h-2 rounded-full bg-flow-primary animate-pulse"></span>
            Tahap 1: Pondasi Frontend
          </span>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="max-w-5xl mx-auto w-full my-auto py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Status Pondasi */}
          <div className="bg-flow-surface rounded-xl p-6 border border-flow-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-flow-primary flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-flow-dark mb-1">Pondasi Frontend Aktif</h2>
              <p className="text-xs text-flow-muted leading-relaxed">
                React, Vite, TypeScript, dan Tailwind CSS telah terkonfigurasi dengan design tokens TaskFlow.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-flow-border text-xs text-flow-muted">
              Framework: <span className="font-semibold text-flow-dark">React 18 + Vite</span>
            </div>
          </div>

          {/* Card 2: Design Tokens Verification */}
          <div className="bg-flow-surface rounded-xl p-6 border border-flow-border shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-semibold text-flow-dark mb-3">Design Tokens TaskFlow</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-flow-muted">Primary (#2563EB)</span>
                  <div className="w-5 h-5 rounded bg-flow-primary border border-flow-border"></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-flow-muted">Primary Hover (#1D4ED8)</span>
                  <div className="w-5 h-5 rounded bg-flow-primary-hover border border-flow-border"></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-flow-muted">Dark Surface (#0F172A)</span>
                  <div className="w-5 h-5 rounded bg-flow-dark border border-flow-border"></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-flow-muted">Border Tone (#E2E8F0)</span>
                  <div className="w-5 h-5 rounded bg-flow-border border border-flow-border"></div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-flow-border text-xs text-flow-muted">
              Gaya: <span className="font-semibold text-flow-dark">Minimalis & Clean</span>
            </div>
          </div>

          {/* Card 3: Backend Integration Link */}
          <div className="bg-flow-surface rounded-xl p-6 border border-flow-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-flow-dark flex items-center justify-center mb-4">
                <Server className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-flow-dark mb-1">Konektivitas Backend</h2>
              <p className="text-xs text-flow-muted leading-relaxed break-all mb-3">
                Base API URL: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-flow-dark">{env.apiUrl}</code>
              </p>

              {loading ? (
                <div className="flex items-center gap-2 text-xs text-flow-muted">
                  <div className="w-3 h-3 rounded-full border-2 border-flow-primary border-t-transparent animate-spin"></div>
                  Mengecek server...
                </div>
              ) : health ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Backend aktif (Uptime: {health.uptime}s)</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{healthError ? `Backend offline: ${healthError}` : `Backend belum aktif di ${env.apiUrl}`}</span>
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-flow-border text-xs text-flow-muted flex items-center justify-between">
              <span>Siap untuk Tahap 2</span>
              <ArrowRight className="w-3.5 h-3.5 text-flow-primary" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-8 border-t border-flow-border flex flex-col sm:flex-row items-center justify-between text-xs text-flow-muted gap-4">
        <p>TaskFlow Cloud &copy; 2026 — Sesuai spesifikasi AGENTS.md</p>
        <p className="text-slate-400">Tahap 1 Selesai: Pondasi, Tooling & Design Tokens</p>
      </footer>
    </div>
  );
};
