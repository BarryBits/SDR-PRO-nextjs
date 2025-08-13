"use client";

import { 
  Menu, 
  Bell, 
  Sun, 
  Moon, 
  Settings, 
  User,
  ChevronDown,
  Calendar,
  LogOut
} from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/context/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useDashboard } from "@/context/dashboard-context";

function getPageTitle(path: string): string {
  if (path.includes("/dashboard")) return "Dashboard";
  if (path.includes("/reports")) return "Relatórios";
  if (path.includes("/leads")) return "Leads";
  if (path.includes("/campaigns")) return "Campanhas";
  if (path.includes("/consultants")) return "Consultores";
  if (path.includes("/settings")) return "Configurações";
  return "Dashboard";
}

function getPageDescription(path: string): string {
  if (path.includes("/dashboard")) return "Visão geral da saúde da sua operação";
  if (path.includes("/reports")) return "Análises detalhadas e métricas avançadas";
  if (path.includes("/leads")) return "Gestão de leads e oportunidades";
  if (path.includes("/campaigns")) return "Campanhas de prospecção ativas";
  if (path.includes("/consultants")) return "Equipe de vendas e performance";
  if (path.includes("/settings")) return "Configurações da plataforma";
  return "Bem-vindo ao SDR Pro";
}

export function Header() {
  const { toggle } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getPageTitle(pathname);
  const pageDescription = getPageDescription(pathname);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { period, setPeriod } = useDashboard();

  const userInitials = user?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "U";

  const handleProfileClick = () => {
    // TODO: Implementar modal de perfil
    console.log("Abrir modal de perfil");
  };

  const handleSettingsClick = () => {
    router.push("/settings");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-lg">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section - Page Context */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggle} 
            className="md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden sm:block">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">{pageTitle}</h1>
            <p className="text-sm text-slate-600 hidden lg:block">{pageDescription}</p>
          </div>
        </div>

        {/* Center Section - Period Selector (only on dashboard) */}
        {pathname.includes("/dashboard") && (
          <div className="hidden md:flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40 h-9 border-slate-200 bg-white shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-lg">
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Right Section - User Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <Bell className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-white border-slate-200 shadow-lg">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notificações</span>
                <Badge variant="secondary">3 novas</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-2 p-2">
                <div className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <p className="text-sm font-medium text-slate-900">Nova resposta recebida</p>
                  <p className="text-xs text-slate-600">Lead João Silva respondeu à campanha</p>
                  <p className="text-xs text-slate-500 mt-1">há 5 minutos</p>
                </div>
                <div className="p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <p className="text-sm font-medium text-slate-900">Reunião agendada</p>
                  <p className="text-xs text-slate-600">Nova reunião marcada para amanhã</p>
                  <p className="text-xs text-slate-500 mt-1">há 15 minutos</p>
                </div>
                <div className="p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <p className="text-sm font-medium text-slate-900">Campanha finalizada</p>
                  <p className="text-xs text-slate-600">Campanha "Prospecção Q4" concluída</p>
                  <p className="text-xs text-slate-500 mt-1">há 1 hora</p>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <div className="w-px h-6 bg-slate-200 mx-2" />

          {/* User Menu - Renomeado para "Perfil" */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 h-10 px-3 hover:bg-slate-100">
                <Avatar className="w-8 h-8 ring-2 ring-blue-500/20">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-900">Perfil</p>
                  <p className="text-xs text-slate-600">{user?.client?.name || 'Empresa de Teste Z'}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200 shadow-lg">
              <DropdownMenuLabel className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="bg-blue-600 text-white">{userInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.name || "Usuário"}</p>
                  <p className="text-xs text-slate-600">{user?.client?.name || 'Empresa de Teste Z'}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleProfileClick}>
                <User className="h-4 w-4 mr-3" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={handleSettingsClick}>
                <Settings className="h-4 w-4 mr-3" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

