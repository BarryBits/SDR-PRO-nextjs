"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function SectionCard({ 
  title, 
  description, 
  children, 
  className,
  headerAction 
}: SectionCardProps) {
  return (
    <Card className={cn(
      "card-premium",
      className
    )}>
      {(title || description || headerAction) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            {title && (
              <CardTitle className="text-lg font-semibold text-foreground">
                {title}
              </CardTitle>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="flex items-center space-x-2">
              {headerAction}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

