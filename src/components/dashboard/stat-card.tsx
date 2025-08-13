"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'destructive' | 'default';
  className?: string;
}

const colorClasses = {
    primary: "bg-primary/20 text-primary",
    accent: "bg-accent/20 text-accent",
    success: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
    destructive: "bg-destructive/20 text-destructive",
    default: "bg-muted text-foreground",
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color = 'primary',
  className
}: StatCardProps) {
  return (
    <Card className={cn(
      "border-border/30 bg-card/80 backdrop-blur-xl shadow-lg hover:shadow-primary/20 hover:translate-y-[-2px] transition-all duration-300", 
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
            <div className={cn("flex items-center justify-center h-8 w-8 rounded-full", colorClasses[color])}>
                <Icon className="h-4 w-4" />
            </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-heading text-foreground">
          {value}
        </div>
        {description && (
            <p className="text-xs text-muted-foreground mt-1">
                {description}
            </p>
        )}
      </CardContent>
    </Card>
  );
}