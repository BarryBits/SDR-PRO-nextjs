"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div className={cn(
      "dashboard-grid",
      className
    )}>
      {children}
    </div>
  );
}

