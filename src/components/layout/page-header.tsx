"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border",
      className
    )}>
      <div className="space-y-1">
        <h1 className="text-3xl font-heading font-bold text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center space-x-2">
          {action}
        </div>
      )}
    </div>
  );
}

