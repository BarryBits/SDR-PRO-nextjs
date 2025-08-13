"use client";

import React, { useState } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Send,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-provider";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Leads", href: "/leads", icon: Users },
  { title: "Campanhas", href: "/campaigns", icon: Send },
  { title: "Consultores", href: "/consultants", icon: UserCog },
  { title: "Configurações", href: "/settings", icon: Settings },
] as const;

export function SidebarNav() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  const toggle = () => setCollapsed(!collapsed);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col sticky top-0 h-screen transition-all duration-300 ease-in-out z-40",
        "bg-card border-r border-border shadow-soft",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="flex items-center h-16 px-4 shrink-0 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-md transition-all duration-200">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="transition-all duration-200">
                <h1 className="font-heading font-bold text-lg text-foreground">
                  SDR Pro
                </h1>
                <p className="text-xs text-muted-foreground -mt-1">
                  Dashboard
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Toggle Button */}
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm"
            className={cn(
              "absolute -right-4 top-4 rounded-full bg-card border-2 border-border shadow-soft h-8 w-8 z-20", 
              "hover:bg-muted hover:border-primary/50 transition-all duration-200",
              "flex items-center justify-center"
            )} 
            onClick={toggle}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          <TooltipProvider delayDuration={100}>
            <div className="space-y-1">
              {navItems.map(({ title, href, icon: Icon }) => {
                const active = pathname.startsWith(href);
                const linkContent = (
                  <Link 
                    href={href} 
                    className={cn(
                      "nav-item group relative",
                      collapsed ? "justify-center" : "justify-start",
                      active && "active"
                    )}
                  >
                    {active && !collapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>
                    )}
                    <Icon 
                      className={cn(
                        "h-5 w-5 transition-all duration-200",
                        collapsed ? "" : "mr-3",
                        active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )} 
                    />
                    {!collapsed && (
                      <span className="flex-1 font-medium">{title}</span>
                    )}
                    {active && collapsed && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full"></div>
                    )}
                  </Link>
                );
                
                return collapsed ? (
                  <Tooltip key={title}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="bg-popover border-border shadow-soft">
                      <p className="font-medium">{title}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div key={title}>{linkContent}</div>
                );
              })}
            </div>
          </TooltipProvider>
        </nav>

        {/* User Info & Logout */}
        <div className="px-3 py-4 border-t border-border">
          {collapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-full h-10 text-muted-foreground hover:text-error hover:bg-error/10 transition-all duration-200" 
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-popover border-border shadow-soft">
                  <p>Sair</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-error hover:bg-error/10 transition-all duration-200" 
              onClick={logout} 
              size="sm"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sair
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}

