// Caminho: src/app/(protected)/(shell)/dashboard/page.tsx

import { format, subDays, startOfDay, endOfDay } from "date-fns";

// --- Server Actions ---
// A importação já estava correta, o que é ótimo.
import { getDashboardSummary } from "@/actions/dashboardActions";

// --- Componentes ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionCenter } from "@/components/dashboard/ActionCenter";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { TodaysMeetings } from "@/components/dashboard/TodaysMeetings";
import { DashboardClientFilters } from "@/components/dashboard/DashboardClientFilters";

// --- Ícones ---
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Calendar,
  Target,
  Clock,
  CheckCircle
} from "lucide-react";

/**
 * Esta página agora é um "Server Component".
 * A lógica de busca de dados acontece aqui, no servidor, ANTES de a página ser enviada para o navegador.
 * Isso é mais rápido e elimina a causa do loop de renderização.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // 1. Lógica de Data (Executada no Servidor)
  // Lemos o período diretamente dos parâmetros da URL. Se não existir, usamos 'last7days' como padrão.
  const period = typeof searchParams?.period === 'string' ? searchParams.period : 'last7days';
  
  // As funções getStartDate e getEndDate não são mais necessárias aqui,
  // pois a lógica de data foi centralizada dentro da Server Action getDashboardSummary.
  // Vamos mantê-las por enquanto caso você precise delas para a UI, mas elas não são mais usadas na chamada da action.
  const getStartDate = (p: string): Date => {
    const now = new Date();
    if (p === 'today') return startOfDay(now);
    if (p === 'yesterday') return startOfDay(subDays(now, 1));
    if (p === 'last30days') return startOfDay(subDays(now, 29));
    return startOfDay(subDays(now, 6)); // Padrão para 'last7days'
  };
  
  const getEndDate = (p: string): Date => {
    const now = new Date();
    if (p === 'yesterday') return endOfDay(subDays(now, 1));
    return endOfDay(now);
  };

  const fromDate = getStartDate(period);
  const toDate = getEndDate(period);

  // 2. Busca de Dados (Executada no Servidor)
  // Chamamos a Server Action diretamente, como se fosse uma função local.
  // Sem `useEffect`, `useState` ou `setLoading`.
  
  // ==================================================================
  // CORREÇÃO APLICADA AQUI
  // O nome da função foi corrigido de `getDashboardStats` para `getDashboardSummary`.
  // Os parâmetros foram corrigidos para passar apenas a string `period`.
  // ==================================================================
  const { data: stats, error } = await getDashboardSummary(period);

  // 3. Tratamento de Erro (Renderização no Servidor)
  if (error) {
    return (
      <div className="text-destructive p-4 border border-destructive/50 rounded-lg">
        <h2 className="font-bold">Erro ao carregar dados do dashboard.</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Se não houver dados, exibimos uma mensagem clara.
  if (!stats) {
    return <p className="text-muted-foreground">Nenhuma estatística encontrada para o período selecionado.</p>;
  }

  // 4. Renderização da página com os dados já prontos
  return (
    <div className="space-y-6">
      {/* O componente de filtros é chamado aqui, cuidando da parte interativa */}
      <DashboardClientFilters initialPeriod={period} />
      
      {/* O restante da página é renderizado com os dados que já buscamos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total de Leads</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total_leads}</div><p className="text-xs text-muted-foreground">{stats.new_leads_today} novos hoje</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle><MessageSquare className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.messages_sent}</div><p className="text-xs text-muted-foreground">{stats.messages_sent_today} hoje</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{(stats.response_rate * 100).toFixed(1)}%</div><p className="text-xs text-muted-foreground">{stats.responses_received} respostas</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Reuniões Agendadas</CardTitle><Calendar className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.meetings_scheduled}</div><p className="text-xs text-muted-foreground">{stats.meetings_today} hoje</p></CardContent></Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActionCenter />
        </div>
        <div className="space-y-6">
          <NotificationCenter />
          <TodaysMeetings />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />Campanhas Ativas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.active_campaigns}</div><p className="text-sm text-muted-foreground">{stats.total_campaigns} no total</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Leads Pendentes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pending_leads}</div><p className="text-sm text-muted-foreground">Aguardando resposta</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle className="h-4 w-4" />Conversões</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.conversions}</div><p className="text-sm text-muted-foreground">{(stats.conversion_rate * 100).toFixed(1)}% de taxa</p></CardContent></Card>
      </div>
    </div>
  );
}