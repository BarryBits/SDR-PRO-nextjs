"use client";

import { useState, useEffect } from "react";
import { ChartCard } from "@/components/dashboard/chart-card";
import { api } from "@/lib/api";

interface ChartData {
  date: string;
  new: number;
  converted: number;
}

/**
 * 🔧 CORREÇÃO: Chart Panel sem dados mockados
 * Conecta com endpoint real /dashboard/chart-data
 */
export default function ChartPanel() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Buscando dados reais do gráfico...");
        const response = await api.get('/dashboard/chart-data?days=7');
        
        if (response.data && response.data.leads_over_time) {
          setData(response.data.leads_over_time);
          console.log(`Dados carregados: ${response.data.leads_over_time.length} pontos`);
        } else {
          console.warn("Resposta da API não contém dados esperados");
          setData([]);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do gráfico:', error);
        setError('Erro ao carregar dados do gráfico');
        // Em caso de erro, usar dados vazios ao invés de mock
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center bg-white rounded-lg border">
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Carregando dados do gráfico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-80 flex items-center justify-center bg-white rounded-lg border">
        <div className="flex flex-col items-center space-y-2">
          <div className="text-red-500">⚠️</div>
          <p className="text-sm text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-xs text-blue-600 hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const subtitle = data.length > 0 
    ? `Últimos ${data.length} dias - Dados reais` 
    : "Sem dados disponíveis";

  return (
    <ChartCard
      title="Leads por dia"
      subtitle={subtitle}
      type="bar"
      data={data}
      dataKeys={{
        x: "date",
        y: ["new", "converted"],
        colors: ["#3b82f6", "#10b981"],
      }}
      height={320}
    />
  );
}

