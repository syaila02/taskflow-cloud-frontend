# TaskFlow Cloud — Frontend Workspace

Dokumentasi status pengembangan frontend, pembagian tugas 2 developer, dan panduan koordinasi tim sesuai pedoman [AGENTS.md](../AGENTS.md).

---

## 1. Status Pengembangan Saat Ini

> **Status Terakhir:** **Tahap 2 (Core Design System & App Layout) — SELESAI**  
> **Kondisi Build:** `npm run build` dan `npm run typecheck` lulus 100% (0 error).

---

## 2. Apa Saja yang SUDAH Selesai Dikerjakan

### Tahap 1: Pondasi & Tooling
- React 18 + Vite 6 + TypeScript 5 + Tailwind CSS 3.
- Design tokens & palet warna TaskFlow (`bg-flow-primary`, `bg-flow-dark`, `bg-flow-canvas`, `bg-flow-surface`, `border-flow-border`, `text-flow-muted`).
- Axios central client dengan request interceptor token & 401 handling (`src/services/api/apiClient.ts`).
- TanStack Query client (`src/lib/queryClient.ts`).
- Typed environment helper (`src/config/env.ts`).

### Tahap 2: Core Design System & App Layout
- **Reusable UI Primitives (`src/components/ui/`):**
  - `Button.tsx` — Varian: primary, secondary, outline, ghost, danger, loading state, icon support.
  - `Input.tsx` — Text input dengan label, icon, helper text, dan pesan validasi error.
  - `Badge.tsx` — Pill badge untuk generic, TaskStatus (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`), dan TaskPriority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - `Card.tsx` — Surface card dengan CardHeader, CardTitle, CardDescription, CardContent, dan CardFooter.
  - `Modal.tsx` — Dialog popup aksesibel dengan backdrop blur, escape key listener, dan tombol aksi.
  - `Spinner.tsx` & `Skeleton.tsx` — Indikator pemuatan dan shimmer placeholder.
  - `EmptyState.tsx` — Komponen tampilan saat data belum tersedia.
- **App Layout Framework (`src/components/layout/`):**
  - `Sidebar.tsx` — Navigasi Dark Navy (`#0F172A`) ala Notion/Linear, workspace switcher, desktop collapsible (20 vs 64), dan mobile slide-over drawer.
  - `Header.tsx` — Topbar sticky dengan breadcrumbs/judul, quick search bar shortcut (`⌘K`), notifikasi, dan user avatar mini.
  - `AppLayout.tsx` — Kerangka utama yang menggabungkan Sidebar, Header, dan area kerja konten responsif.
  - `ProtectedRoute.tsx` — Komponen penjaga rute privat yang siap dihubungkan ke AuthContext di Tahap 3.
- **Workspace Preview Page (`src/pages/dashboard/WorkspacePreview.tsx`):**
  - Welcome banner workspace TaskFlow Cloud.
  - 3 Kartu metrik placeholder (Total Projects, Active Tasks, Completed Tasks) dengan status jujur tanpa mock data fiktif.
  - Area Recent Activity dengan `EmptyState`.
  - Showcase interaktif komponen Button, Input, Modal, dan Badges.
- **Graceful Routing (`src/pages/ModulePlaceholder.tsx`):**
  - Navigasi sidebar (`/tasks`, `/projects`, `/board`, `/calendar`, `/team`, `/settings`) ditangani dengan aman tanpa crash.

---

## 3. Pembagian Peran 2 Frontend Developer (AGENTS.md §5.3 & §5.4)

Untuk membagi pekerjaan secara adil dan mencegah bentrok kode (*merge conflict*), berikut pembagian modulnya:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ FRONTEND DEVELOPER 1: Authentication, Dashboard, & User Profile        │
│ Tanggung Jawab:                                                        │
│ - Halaman Registrasi (`/register`) & Login (`/login`)                  │
│ - AuthContext & Protected Routes (penjaga rute login)                  │
│ - Dashboard Utama (`/`) (ringkasan metrik & aktivitas)                 │
│ - Halaman User Profile (`/profile`) (edit nama & email)                │
│ - Komponen UI bersama (Buttons, Inputs, Modals, Badges)                │
├────────────────────────────────────────────────────────────────────────┤
│ FRONTEND DEVELOPER 2: Projects, Tasks, & Team Collaboration            │
│ Tanggung Jawab:                                                        │
│ - Halaman Daftar Proyek (`/projects`) & Detail Proyek                  │
│ - Tampilan Tugas: Table View, Kanban Board, Calendar View              │
│ - Modal Tambah/Edit Tugas & ubah status/prioritas                      │
│ - Halaman Anggota Tim (`/projects/:projectId/team`) & Invite Modal     │
│ - Antarmuka pengaturan Role anggota (OWNER, ADMIN, MEMBER)             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Apa Saja yang BELUM Dikerjakan (Roadmap Selanjutnya)

Berikut daftar pekerjaan yang tersisa untuk diselesaikan bertahap:

### Tahap 2: Core Design System & Reusable UI Components *(Pondasi Bersama)*
- [ ] Buat komponen atomik di `src/components/ui/`:
  - `Button.tsx` (varian: primary, secondary, ghost, danger, outline)
  - `Input.tsx` (dengan label, ikon, dan teks error)
  - `Badge.tsx` (pill badge untuk status dan prioritas tugas)
  - `Card.tsx` (container surface dengan border halus)
  - `Modal.tsx` (dialog popup untuk form)
  - `Spinner.tsx` & `Skeleton.tsx` (loading state)
  - `EmptyState.tsx` (tampilan jika data belum ada)
- [ ] Buat komponen layout di `src/components/layout/`:
  - `AppLayout.tsx` (wrapper halaman dalam aplikasi)
  - `Sidebar.tsx` (navigasi workspace, collapse mode, responsive drawer)
  - `Header.tsx` (breadcrumbs, user profile avatar, search trigger)
  - `ProtectedRoute.tsx` (pengecekan token sebelum render halaman privat)

### Tahap 3: Modul Authentication *(Frontend Developer 1)*
- [ ] Buat `AuthContext.tsx` di `src/context/` untuk menyimpan status login, user, dan token.
- [ ] Buat service `src/services/auth.service.ts` terhubung ke API backend asli:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- [ ] Buat `LoginPage.tsx` dan `RegisterPage.tsx` di `src/pages/auth/`.

### Tahap 4: Dashboard & Profile *(Frontend Developer 1)*
- [ ] Buat `ProfilePage.tsx` terhubung ke `GET /api/v1/users/me` dan `PATCH /api/v1/users/me`.
- [ ] Buat `DashboardPage.tsx` dengan kartu metrik (Total Projects, Tasks Due, Progress) serta empty state jika proyek belum ada.

### Tahap 5: Modul Project & Task Interface *(Frontend Developer 2)*
- [ ] Buat `ProjectListPage.tsx` (grid kartu proyek, tombol buat proyek baru).
- [ ] Buat `ProjectDetailPage.tsx` dengan tab navigasi:
  - **Table View:** Kolom judul, status badge, prioritas, assignee, deadline.
  - **Kanban Board:** Kolom alur kerja (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`).
  - **Calendar View:** Tampilan kalender untuk memantau tenggat waktu.
- [ ] Buat modal pembuatan & pengubahan tugas.

### Tahap 6: Modul Team Collaboration *(Frontend Developer 2)*
- [ ] Buat `TeamPage.tsx` untuk menampilkan daftar anggota proyek.
- [ ] Modal kirim undangan anggota via email (`POST /invitations`).
- [ ] Dropdown pengubahan role keanggotaan (`ADMIN` / `MEMBER`).

---

## 5. Cara Menjalankan Project Lokal (Untuk Rekan Tim)

Bagi rekan tim yang baru clone atau pull repo ini:

```powershell
# 1. Masuk ke folder frontend
cd frontend

# 2. Install dependensi
npm install

# 3. Siapkan file environment
Copy-Item .env.example .env

# 4. Jalankan development server
npm run dev
# Buka browser di http://localhost:5173
```

Perintah pengujian kode:
- `npm run typecheck` — Memeriksa kesalahan tipe TypeScript tanpa compile.
- `npm run build` — Melakukan build produksi ke folder `dist/`.

---

## 6. Aturan Kolaborasi Git (AGENTS.md §10)

1. **Gunakan Branch Fitur:**
   - Jangan langsung push ke `main` saat mengerjakan fitur baru.
   - Contoh nama branch:
     - `feature/authentication` (untuk Dev 1)
     - `feature/dashboard-profile` (untuk Dev 1)
     - `feature/project-task-interface` (untuk Dev 2)
     - `feature/team-collaboration` (untuk Dev 2)
2. **Format Commit (Conventional Commits):**
   - `feat: membuat halaman login dan registrasi`
   - `feat: membuat komponen Kanban board untuk tugas`
   - `fix: memperbaiki responsive sidebar pada mobile`
   - `style: merapikan padding pada tabel tugas`
3. **Keamanan:**
   - Jangan pernah melakukan commit file `.env` (file ini sudah masuk `.gitignore`).
