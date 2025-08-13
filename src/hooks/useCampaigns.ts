import { useState, useEffect, useCallback } from 'react';
// IMPORTA O TIPO 'Campaign' DA NOSSA FONTE CENTRAL DA VERDADE.
import { type Campaign } from '@/lib/types';

// Interface para a resposta paginada da API.
export interface PaginatedCampaigns {
  total: number;
  page: number;
  limit: number;
  items: Campaign[];
}

/**
 * Hook customizado para buscar e gerenciar os dados de campanhas.
 * Ele lida com estado de carregamento, erros e a busca de dados paginados.
 */
export function useCampaigns(page: number = 1, limit: number = 10) {
  const [data, setData] = useState<PaginatedCampaigns>({ total: 0, page, limit, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/campaigns/get?page=${page}&limit=${limit}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao carregar campanhas.');
      }
      const result = await response.json();
      
      // O resultado agora é tratado com o tipo 'Campaign' correto e completo.
      setData({ total: result.total || 0, page, limit, items: result.items || [] });
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar campanhas.');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Retorna os dados e controles para o componente que o utiliza.
  return { ...data, loading, error, refetch: fetchCampaigns };
}