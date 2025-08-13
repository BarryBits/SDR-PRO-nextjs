import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface MetricsData {
  kpis: {
    total_leads: number;
    total_campaigns: number;
    total_meetings_scheduled: number;
    response_rate: number;
  };
  status_distribution: Array<{
    status: string;
    count: number;
  }>;
  leads_over_time: Array<{
    date: string;
    count: number;
  }>;
}

export type PeriodFilter = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month';

export function useMetrics(period: PeriodFilter = 'last_7_days') {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null); // RESET DO ERRO ANTES DE NOVA REQUISIÇÃO
    try {
      const response = await api.get<MetricsData>('/dashboard/data', {
        params: { period },
      });
      setData(response.data);
    } catch (err: any) {
      console.error('Erro ao buscar métricas:', err);
      setError(err.response?.data?.detail || 'Erro ao carregar métricas do dashboard.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    data,
    loading,
    error,
    refetch: fetchMetrics,
  };
}

export interface ChartData {
  period: string;
  data: Array<{
    date: string;
    leads: number;
    responses: number;
  }>;
}

export function useLeadsChart(period: PeriodFilter = 'last_7_days') {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    setError(null); // RESET DO ERRO ANTES DE NOVA REQUISIÇÃO
    try {
      const response = await api.get<ChartData>(`/metrics/leads-chart?period=${period}`);
      setData(response.data);
    } catch (err: any) {
      console.error('Erro ao buscar dados do gráfico:', err);
      setError(err.response?.data?.detail || 'Erro ao carregar dados do gráfico.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  return {
    data,
    loading,
    error,
    refetch: fetchChartData
  };
}