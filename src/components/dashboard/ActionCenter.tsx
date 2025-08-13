// Caminho: src/components/dashboard/ActionCenter.tsx
"use client"; // NECESSÁRIO: para gerenciar o estado do modal e carregar dados no cliente.

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, Zap, Users, RefreshCw, CheckCircle, Loader2 } from "lucide-react";
import { getActionableInsights, type ActionableInsight } from "@/actions/dashboardActions";
import { FollowUpModal } from './FollowUpModal'; // Importa o novo modal que criaremos

/**
 * A Central de Ações agora é um Componente de Cliente para poder gerenciar
 * o estado do modal de follow-up e carregar os insights dinamicamente.
 */
export function ActionCenter() {
  const [insights, setInsights] = useState<ActionableInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para controlar o modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<ActionableInsight | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getActionableInsights();
      if (result.error) {
        throw new Error(result.error);
      }
      setInsights(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleActionClick = (insight: ActionableInsight) => {
    setSelectedInsight(insight);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInsight(null);
    // Recarrega os insights após fechar o modal, pois uma ação pode ter sido executada
    // e o insight pode não ser mais válido.
    fetchInsights();
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />Central de Ações Recomendadas</CardTitle>
          <CardDescription>Buscando oportunidades para você...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/20 h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle />Erro na Central de Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={fetchInsights} className="mt-4">Tentar Novamente</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-heading">Central de Ações Recomendadas</h2>
        {insights.length === 0 ? (
          <Card className="h-full">
            <CardContent>
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="font-medium">Está tudo em ordem!</p>
                <p className="text-sm">Nenhuma ação recomendada no momento.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <Card key={`${insight.type}-${index}`} className="border-primary/20 bg-primary/5 shadow-soft hover-lift transition-transform duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-blue-500" />
                    {insight.title}
                  </CardTitle>
                  <CardDescription>{insight.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {insight.leadCount} Leads
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Campanha: <span className="font-semibold">{insight.campaignName}</span>
                      </p>
                    </div>
                    <Button onClick={() => handleActionClick(insight)}>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Reativar Leads
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* O Modal é renderizado aqui e controlado pelo estado. Ele só aparece quando isModalOpen é true. */}
      <FollowUpModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        insight={selectedInsight}
      />
    </>
  );
}
