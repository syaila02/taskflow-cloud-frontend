import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Kanban,
  Calendar,
  Users,
  Settings,
  ChevronDown,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'My Tasks', path: '/tasks', icon: CheckSquare, badge: 'Soon' },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Board', path: '/board', icon: Kanban, badge: 'Soon' },
  { label: 'Calendar', path: '/calendar', icon: Calendar, badge: 'Soon' },
  { label: 'Team', path: '/team', icon: Users, badge: 'Soon' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileClose,
}) => {
  const location = useLocation();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-flow-dark text-slate-200 select-none">
      {/* Brand & Logo Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-flow-primary flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold tracking-tight text-white truncate">
                TaskFlow Cloud
              </span>
              <span className="text-[11px] text-slate-400 font-medium">SaaS Workspace</span>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Tutup Menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Workspace Switcher */}
      <div className="p-3 border-b border-slate-800/80">
        <button
          type="button"
          className={twMerge(
            clsx(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-left transition-colors border border-slate-700/60 text-xs',
              isCollapsed && 'justify-center px-1.5',
            ),
          )}
        >
          <div className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
            T
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 truncate">
                <p className="font-medium text-slate-200 truncate">Main Workspace</p>
                <p className="text-[10px] text-slate-400 truncate">TaskFlow Team</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            </>
          )}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!isCollapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace Menu
          </p>
        )}
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive: navActive }) =>
                twMerge(
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors relative group',
                    navActive || isActive
                      ? 'bg-flow-primary text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70',
                    isCollapsed && 'justify-center px-2',
                  ),
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!isCollapsed && item.badge && !isActive && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-normal">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Profile & Settings Section */}
      <div className="p-3 border-t border-slate-800/80 space-y-1">
        <NavLink
          to="/settings"
          onClick={onMobileClose}
          title={isCollapsed ? 'Settings' : undefined}
          className={twMerge(
            clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-colors',
              location.pathname === '/settings' && 'bg-slate-800 text-white',
              isCollapsed && 'justify-center px-2',
            ),
          )}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>

        {/* User Profile Mini Bar */}
        <div
          className={twMerge(
            clsx(
              'flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/30 border border-slate-800 mt-2',
              isCollapsed && 'justify-center p-1.5',
            ),
          )}
        >
          <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-semibold text-xs flex-shrink-0">
            U
          </div>
          {!isCollapsed && (
            <div className="flex-1 truncate">
              <p className="text-xs font-medium text-slate-200 truncate">Developer Mode</p>
              <p className="text-[10px] text-slate-400 truncate">Tahap 2 Workspace</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={twMerge(
          clsx(
            'hidden lg:flex flex-col flex-shrink-0 border-r border-slate-800 transition-all duration-200 ease-in-out z-30 sticky top-0 h-screen',
            isCollapsed ? 'w-20' : 'w-64',
          ),
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Content */}
      <aside
        className={twMerge(
          clsx(
            'fixed top-0 bottom-0 left-0 w-64 z-50 lg:hidden transform transition-transform duration-200 ease-in-out shadow-2xl',
            isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          ),
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
