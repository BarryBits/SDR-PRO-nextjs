// Caminho: src/components/dashboard/DashboardClientFilters.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, RefreshCw } from "lucide-react";

interface DashboardClientFiltersProps {
  initialPeriod: string;
}

/**
 * Este é um "Componente de Cliente" (`use client`).
 * Sua única responsabilidade é cuidar da interatividade dos filtros.
 * Ele não busca dados, apenas gerencia o estado da URL.
 */
export function DashboardClientFilters({ initialPeriod }: DashboardClientFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Função chamada quando o usuário muda o período no seletor.
   * Ela atualiza o parâmetro 'period' na URL.
   */
  const handlePeriodChange = (period: string) => {
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
    currentParams.set("period", period);
    const search = currentParams.toString();
    const query = search ? `?${search}` : "";

    // Navega para a nova URL, o que fará o Next.js re-renderizar a página no servidor com o novo filtro.
    router.push(`/dashboard${query}`);
  };

  /**
   * Função para o botão de atualizar.
   * `router.refresh()` diz ao Next.js para buscar novamente os dados da página no servidor, sem um recarregamento completo da página.
   */
  const handleRefresh = () => {
    router.refresh();
  };

  /**
   * Formata o intervalo de datas para exibição amigável.
   */
  const formatDateRange = () => {
    const now = new Date();
    let fromDate: Date;
    let toDate: Date = endOfDay(now);

    switch(initialPeriod) {
      case 'today':
        fromDate = startOfDay(now);
        break;
      case 'yesterday':
        const yesterday = subDays(now, 1);
        fromDate = startOfDay(yesterday);
        toDate = endOfDay(yesterday);
        break;
      case 'last30days':
        fromDate = startOfDay(subDays(now, 29));
        break;
      default: // padrão para 'last7days'
        fromDate = startOfDay(subDays(now, 6));
    }
    
    return `${format(fromDate, "dd 'de' MMMM", { locale: ptBR })} - ${format(toDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral de suas atividades - {formatDateRange()}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={initialPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="last7days">Últimos 7 dias</SelectItem>
              <SelectItem value="last30days">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>
    </div>
  );
}