"use client";

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
  TrendingUp,
  Zap,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Leads", href: "/leads", icon: Users },
  { title: "Campanhas", href: "/campaigns", icon: Send },
  { title: "Consultores", href: "/consultants", icon: UserCog },
  { title: "Configurações", href: "/settings", icon: Settings },
] as const;

export function Sidebar() {
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col sticky top-0 h-screen transition-all duration-300 ease-in-out z-40",
        "bg-white border-r border-slate-200 shadow-lg",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="flex items-center h-16 px-4 shrink-0 border-b border-slate-200">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="transition-all duration-200">
                <h1 className="font-bold text-lg text-slate-900">SDR Pro</h1>
                <p className="text-xs text-slate-500 -mt-1">Dashboard</p>
              </div>
            )}
          </Link>
        </div>

        {/* Toggle Button - MAIS VISÍVEL */}
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm"
            className={cn(
              "absolute -right-4 top-4 rounded-full bg-white border-2 border-slate-300 shadow-lg h-8 w-8 z-20", 
              "hover:bg-slate-50 hover:border-slate-400 transition-all duration-200",
              "flex items-center justify-center"
            )} 
            onClick={toggle}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-slate-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-slate-600" />
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
                      "group flex items-center rounded-lg p-3 text-sm font-medium transition-all duration-200 relative",
                      "hover:bg-slate-100 active:scale-[0.98]",
                      collapsed ? "justify-center" : "justify-start",
                      active 
                        ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-200" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {active && !collapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>
                    )}
                    <Icon 
                      className={cn(
                        "h-5 w-5 transition-all duration-200",
                        collapsed ? "" : "mr-3",
                        active ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
                      )} 
                    />
                    {!collapsed && (
                      <span className="flex-1">{title}</span>
                    )}
                    {active && collapsed && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-l-full"></div>
                    )}
                  </Link>
                );
                
                return collapsed ? (
                  <Tooltip key={title}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="bg-white border-slate-200 shadow-lg">
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

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-200">
          {collapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-full h-10 text-slate-500 hover:text-red-600 hover:bg-red-50" 
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-white border-slate-200 shadow-lg">
                  <p>Sair</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50" 
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

