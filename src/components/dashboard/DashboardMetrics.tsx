"use server";
import { getDashboardSummary } from "@/actions/dashboardActions";
import { StatsGrid } from "@/components/data/stats-grid";
import { MetricCard } from "@/components/data/metrics-card";
import { Users, Target, Calendar, TrendingUp } from 'lucide-react';

export async function DashboardMetrics() {
    const { data: summary } = await getDashboardSummary("30d");

    if (!summary) {
        return <p>Não foi possível carregar as métricas.</p>;
    }

    return (
        <StatsGrid>
            <MetricCard title="Total de Leads" value={summary.total_leads} icon={<Users className="h-5 w-5" />} variant="primary" />
            <MetricCard title="Taxa de Resposta" value={`0%`} icon={<Target className="h-5 w-5" />} variant="default" />
            <MetricCard title="Reuniões Agendadas" value={0} icon={<Calendar className="h-5 w-5" />} variant="default" />
            <MetricCard title="Taxa de Conversão" value={`0%`} icon={<TrendingUp className="h-5 w-5" />} variant="success" />
        </StatsGrid>
    );
}