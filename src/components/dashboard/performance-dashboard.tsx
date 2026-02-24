// src/components/dashboard/performance-dashboard.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  Clock, MessageSquare, Users, Calendar, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Activity, Zap, Target, Timer
} from 'lucide-react';

interface PerformanceMetrics {
  response_metrics: {
    average_response_time_minutes: number;
    total_conversations: number;
    response_time_samples: number;
  };
  followup_metrics: {
    leads_with_followup: number;
    followup_rate: number;
    average_followups_per_lead: number;
  };
  reactivation_metrics: {
    reactivated_leads: number;
    reactivation_rate: number;
  };
  scheduling_metrics: {
    scheduled_meetings: number;
    scheduling_efficiency: number;
  };
  activity_distribution: Record<string, number>;
}

interface FunnelMetrics {
  funnel_stages: {
    total_leads: number;
    contacted: number;
    replied: number;
    qualifying: number;
    meeting_scheduled: number;
    converted: number;
    lost: number;
  };
  conversion_rates: {
    contact_rate: number;
    reply_rate: number;
    qualification_rate: number;
    scheduling_rate: number;
    conversion_rate: number;
  };
  source_analysis: Record<string, any>;
  daily_progression: Record<string, any>;
}

interface ConsultantMetrics {
  consultants: Array<{
    consultant_id: string;
    consultant_name: string;
    total_leads: number;
    scheduled_meetings: number;
    converted_leads: number;
    scheduling_rate: number;
    conversion_rate: number;
    active_calendars: number;
  }>;
}

export default function PerformanceDashboard() {
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics | null>(null);
  const [consultantMetrics, setConsultantMetrics] = useState<ConsultantMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('last_30_days');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAllMetrics();

    // Configurar refresh automático a cada 5 minutos
    const interval = setInterval(fetchAllMetrics, 5 * 60 * 1000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [period]);

  const fetchAllMetrics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Buscar métricas de performance
      const performanceResponse = await fetch(`/api/dashboard/metrics/performance?period=${period}`, { headers });
      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json();
        setPerformanceMetrics(performanceData);
      }

      // Buscar métricas de funil
      const funnelResponse = await fetch(`/api/dashboard/metrics/funnel?period=${period}`, { headers });
      if (funnelResponse.ok) {
        const funnelData = await funnelResponse.json();
        setFunnelMetrics(funnelData);
      }

      // Buscar métricas de consultores
      const consultantResponse = await fetch(`/api/dashboard/metrics/consultants?period=${period}`, { headers });
      if (consultantResponse.ok) {
        const consultantData = await consultantResponse.json();
        setConsultantMetrics(consultantData);
      }
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}min`;
    } else if (minutes < 1440) {
      return `${Math.round(minutes / 60)}h ${Math.round(minutes % 60)}min`;
    } else {
      return `${Math.round(minutes / 1440)}d`;
    }
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const activityData = performanceMetrics ?
    Object.entries(performanceMetrics.activity_distribution).map(([hour, count]) => ({
      hour: `${hour}h`,
      messages: count
    })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour)) : [];

  const funnelData = funnelMetrics ? [
    { name: 'Total', value: funnelMetrics.funnel_stages.total_leads, color: '#8884d8' },
    { name: 'Contatados', value: funnelMetrics.funnel_stages.contacted, color: '#82ca9d' },
    { name: 'Responderam', value: funnelMetrics.funnel_stages.replied, color: '#ffc658' },
    { name: 'Qualificados', value: funnelMetrics.funnel_stages.qualifying, color: '#ff7300' },
    { name: 'Agendados', value: funnelMetrics.funnel_stages.meeting_scheduled, color: '#00ff00' },
    { name: 'Convertidos', value: funnelMetrics.funnel_stages.converted, color: '#0088fe' }
  ] : [];

  if (loading && !performanceMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Performance</h2>
          <p className="text-muted-foreground">
            Métricas em tempo real do sistema • Última atualização: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={period === 'last_7_days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('last_7_days')}
          >
            7 dias
          </Button>
          <Button
            variant={period === 'last_30_days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('last_30_days')}
          >
            30 dias
          </Button>
          <Button
            variant={period === 'last_90_days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('last_90_days')}
          >
            90 dias
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(
                performanceMetrics.response_metrics.average_response_time_minutes,
                { good: 30, warning: 60 }
              )}`}>
                {formatResponseTime(performanceMetrics.response_metrics.average_response_time_minutes)}
              </div>
              <p className="text-xs text-muted-foreground">
                {performanceMetrics.response_metrics.response_time_samples} amostras
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Follow-up</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(
                performanceMetrics.followup_metrics.followup_rate,
                { good: 80, warning: 60 }
              )}`}>
                {performanceMetrics.followup_metrics.followup_rate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {performanceMetrics.followup_metrics.average_followups_per_lead.toFixed(1)} follow-ups/lead
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Reativação</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(
                performanceMetrics.reactivation_metrics.reactivation_rate,
                { good: 25, warning: 15 }
              )}`}>
                {performanceMetrics.reactivation_metrics.reactivation_rate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {performanceMetrics.reactivation_metrics.reactivated_leads} reativados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eficiência de Agendamento</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(
                performanceMetrics.scheduling_metrics.scheduling_efficiency,
                { good: 15, warning: 10 }
              )}`}>
                {performanceMetrics.scheduling_metrics.scheduling_efficiency.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {performanceMetrics.scheduling_metrics.scheduled_meetings} reuniões
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Funil de Conversão</TabsTrigger>
          <TabsTrigger value="activity">Atividade por Horário</TabsTrigger>
          <TabsTrigger value="consultants">Performance dos Consultores</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          {funnelMetrics && (
            <>
              {/* Taxas de Conversão */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Taxa de Contato</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{funnelMetrics.conversion_rates.contact_rate.toFixed(1)}%</div>
                    <Progress value={funnelMetrics.conversion_rates.contact_rate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Taxa de Resposta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{funnelMetrics.conversion_rates.reply_rate.toFixed(1)}%</div>
                    <Progress value={funnelMetrics.conversion_rates.reply_rate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Taxa de Qualificação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{funnelMetrics.conversion_rates.qualification_rate.toFixed(1)}%</div>
                    <Progress value={funnelMetrics.conversion_rates.qualification_rate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Taxa de Agendamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{funnelMetrics.conversion_rates.scheduling_rate.toFixed(1)}%</div>
                    <Progress value={funnelMetrics.conversion_rates.scheduling_rate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Taxa de Conversão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{funnelMetrics.conversion_rates.conversion_rate.toFixed(1)}%</div>
                    <Progress value={funnelMetrics.conversion_rates.conversion_rate} className="mt-2" />
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de Funil */}
              <Card>
                <CardHeader>
                  <CardTitle>Funil de Conversão</CardTitle>
                  <CardDescription>Visualização do funil de vendas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={funnelData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Atividade por Horário</CardTitle>
              <CardDescription>Volume de mensagens enviadas por hora do dia</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="messages" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultants" className="space-y-4">
          {consultantMetrics && (
            <div className="grid gap-4">
              {consultantMetrics.consultants.map((consultant) => (
                <Card key={consultant.consultant_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{consultant.consultant_name}</CardTitle>
                        <CardDescription>
                          {consultant.active_calendars} calendário(s) conectado(s)
                        </CardDescription>
                      </div>
                      <Badge variant={consultant.active_calendars > 0 ? 'default' : 'secondary'}>
                        {consultant.active_calendars > 0 ? 'Ativo' : 'Sem Calendário'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{consultant.total_leads}</div>
                        <div className="text-sm text-muted-foreground">Total de Leads</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{consultant.scheduled_meetings}</div>
                        <div className="text-sm text-muted-foreground">Reuniões Agendadas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{consultant.converted_leads}</div>
                        <div className="text-sm text-muted-foreground">Convertidos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{consultant.scheduling_rate.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Taxa de Agendamento</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{consultant.conversion_rate.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Taxa de Conversão</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

