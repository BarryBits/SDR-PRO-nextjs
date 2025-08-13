"use client";

import React from 'react';
import { AppHeader } from '../navigation/app-header';
import { SidebarNav } from '../navigation/sidebar-nav';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950">
      <AppHeader />
      <div className="flex flex-1">
        <SidebarNav />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-screen-2xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

