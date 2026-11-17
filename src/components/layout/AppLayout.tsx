import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export interface AppLayoutProps {
  children?: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  headerTitle,
  headerSubtitle,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-flow-canvas flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          onMobileMenuOpen={() => setIsMobileOpen(true)}
          title={headerTitle}
          subtitle={headerSubtitle}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};
