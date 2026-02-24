// src/components/campaigns/advanced-metrics.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, MessageSquare, Calendar,
  Target, Clock, AlertCircle, CheckCircle, XCircle, Download
} from 'lucide-react';

interface CampaignMetrics {
  campaign_id: string;
  campaign_name: string;
  template_name: string;
  status: string;
  total_leads: number;
  contacted_leads: number;
  replied_leads: number;
  qualified_leads: number;
  scheduled_leads: number;
  converted_leads: number;
  lost_leads: number;
  contact_rate: number;
  reply_rate: number;
  qualification_rate: number;
  scheduling_rate: number;
  conversion_rate: number;
  followup_distribution: Record<string, number>;
}

interface AdvancedMetricsProps {
  clientId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdvancedMetrics({ clientId }: AdvancedMetricsProps) {
  const [metrics, setMetrics] = useState<CampaignMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('last_30_days');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');

  useEffect(() => {
    fetchMetrics();
  }, [period, selectedCampaign]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period,
        ...(selectedCampaign !== 'all' && { campaign_id: selectedCampaign })
      });

      const response = await fetch(`/api/dashboard/metrics/campaigns?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.campaigns || []);
      }
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const params = new URLSearchParams({ period, format: 'json' });
      const response = await fetch(`/api/dashboard/export/report?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campaign-metrics-${period}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  const totalMetrics = metrics.reduce((acc, campaign) => ({
    total_leads: acc.total_leads + campaign.total_leads,
    contacted_leads: acc.contacted_leads + campaign.contacted_leads,
    replied_leads: acc.replied_leads + campaign.replied_leads,
    qualified_leads: acc.qualified_leads + campaign.qualified_leads,
    scheduled_leads: acc.scheduled_leads + campaign.scheduled_leads,
    converted_leads: acc.converted_leads + campaign.converted_leads,
    lost_leads: acc.lost_leads + campaign.lost_leads
  }), {
    total_leads: 0,
    contacted_leads: 0,
    replied_leads: 0,
    qualified_leads: 0,
    scheduled_leads: 0,
    converted_leads: 0,
    lost_leads: 0
  });

  const overallRates = {
    contact_rate: totalMetrics.total_leads > 0 ? (totalMetrics.contacted_leads / totalMetrics.total_leads * 100) : 0,
    reply_rate: totalMetrics.contacted_leads > 0 ? (totalMetrics.replied_leads / totalMetrics.contacted_leads * 100) : 0,
    qualification_rate: totalMetrics.replied_leads > 0 ? (totalMetrics.qualified_leads / totalMetrics.replied_leads * 100) : 0,
    scheduling_rate: totalMetrics.qualified_leads > 0 ? (totalMetrics.scheduled_leads / totalMetrics.qualified_leads * 100) : 0,
    conversion_rate: totalMetrics.total_leads > 0 ? (totalMetrics.converted_leads / totalMetrics.total_leads * 100) : 0
  };

  const funnelData = [
    { name: 'Total Leads', value: totalMetrics.total_leads, fill: '#8884d8' },
    { name: 'Contatados', value: totalMetrics.contacted_leads, fill: '#82ca9d' },
    { name: 'Responderam', value: totalMetrics.replied_leads, fill: '#ffc658' },
    { name: 'Qualificados', value: totalMetrics.qualified_leads, fill: '#ff7300' },
    { name: 'Agendados', value: totalMetrics.scheduled_leads, fill: '#00ff00' },
    { name: 'Convertidos', value: totalMetrics.converted_leads, fill: '#0088fe' }
  ];

  const campaignPerformanceData = metrics.map(campaign => ({
    name: campaign.campaign_name.substring(0, 20) + '...',
    contact_rate: campaign.contact_rate,
    reply_rate: campaign.reply_rate,
    conversion_rate: campaign.conversion_rate,
    total_leads: campaign.total_leads
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Últimos 7 dias</SelectItem>
              <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
              <SelectItem value="last_90_days">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas as campanhas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as campanhas</SelectItem>
              {metrics.map(campaign => (
                <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                  {campaign.campaign_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={exportReport} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* KPIs Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Contato</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallRates.contact_rate.toFixed(1)}%</div>
            <Progress value={overallRates.contact_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallRates.reply_rate.toFixed(1)}%</div>
            <Progress value={overallRates.reply_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Qualificação</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallRates.qualification_rate.toFixed(1)}%</div>
            <Progress value={overallRates.qualification_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Agendamento</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallRates.scheduling_rate.toFixed(1)}%</div>
            <Progress value={overallRates.scheduling_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallRates.conversion_rate.toFixed(1)}%</div>
            <Progress value={overallRates.conversion_rate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs com diferentes visualizações */}
      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Funil de Conversão</TabsTrigger>
          <TabsTrigger value="performance">Performance por Campanha</TabsTrigger>
          <TabsTrigger value="details">Detalhes das Campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão Geral</CardTitle>
              <CardDescription>
                Visualização do funil de conversão agregado de todas as campanhas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel
                    dataKey="value"
                    data={funnelData}
                    isAnimationActive
                  >
                    <LabelList position="center" fill="#fff" stroke="none" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Campanha</CardTitle>
              <CardDescription>
                Comparação das taxas de conversão entre campanhas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={campaignPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="contact_rate" fill="#8884d8" name="Taxa de Contato %" />
                  <Bar dataKey="reply_rate" fill="#82ca9d" name="Taxa de Resposta %" />
                  <Bar dataKey="conversion_rate" fill="#ffc658" name="Taxa de Conversão %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4">
            {metrics.map((campaign) => (
              <Card key={campaign.campaign_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{campaign.campaign_name}</CardTitle>
                      <CardDescription>
                        Template: {campaign.template_name} •
                        Status: <Badge variant={campaign.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{campaign.total_leads}</div>
                      <div className="text-sm text-muted-foreground">Total de Leads</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{campaign.contacted_leads}</div>
                      <div className="text-xs text-muted-foreground">Contatados</div>
                      <div className="text-xs font-medium">{campaign.contact_rate.toFixed(1)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{campaign.replied_leads}</div>
                      <div className="text-xs text-muted-foreground">Responderam</div>
                      <div className="text-xs font-medium">{campaign.reply_rate.toFixed(1)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-yellow-600">{campaign.qualified_leads}</div>
                      <div className="text-xs text-muted-foreground">Qualificados</div>
                      <div className="text-xs font-medium">{campaign.qualification_rate.toFixed(1)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">{campaign.scheduled_leads}</div>
                      <div className="text-xs text-muted-foreground">Agendados</div>
                      <div className="text-xs font-medium">{campaign.scheduling_rate.toFixed(1)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-emerald-600">{campaign.converted_leads}</div>
                      <div className="text-xs text-muted-foreground">Convertidos</div>
                      <div className="text-xs font-medium">{campaign.conversion_rate.toFixed(1)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">{campaign.lost_leads}</div>
                      <div className="text-xs text-muted-foreground">Perdidos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

