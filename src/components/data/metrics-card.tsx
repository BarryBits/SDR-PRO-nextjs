"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

export function MetricCard({ 
  icon, 
  title, 
  value, 
  trend, 
  trendValue,
  description,
  className,
  variant = 'default'
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-error" />;
      case 'neutral':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-error';
      case 'neutral':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'border-primary/20 bg-primary/5';
      case 'secondary':
        return 'border-secondary/20 bg-secondary/5';
      case 'success':
        return 'border-success/20 bg-success/5';
      case 'warning':
        return 'border-warning/20 bg-warning/5';
      case 'error':
        return 'border-error/20 bg-error/5';
      case 'info':
        return 'border-info/20 bg-info/5';
      default:
        return '';
    }
  };

  return (
    <Card className={cn(
      "hover-lift transition-all duration-300",
      getVariantStyles(),
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {icon && (
                <div className={cn(
                  "p-2 rounded-lg",
                  variant === 'primary' ? 'bg-primary/10 text-primary' :
                  variant === 'secondary' ? 'bg-secondary/10 text-secondary' :
                  variant === 'success' ? 'bg-success/10 text-success' :
                  variant === 'warning' ? 'bg-warning/10 text-warning' :
                  variant === 'error' ? 'bg-error/10 text-error' :
                  variant === 'info' ? 'bg-info/10 text-info' :
                  'bg-primary/10 text-primary'
                )}>
                  {icon}
                </div>
              )}
              <h3 className="text-sm font-medium text-muted-foreground">
                {title}
              </h3>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">
                {value}
              </p>
              {description && (
                <p className="text-xs text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {(trend || trendValue) && (
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              {trendValue && (
                <span className={cn(
                  "text-sm font-medium",
                  getTrendColor()
                )}>
                  {trendValue}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}