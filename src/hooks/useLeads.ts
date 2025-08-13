import { useState, useEffect, useCallback } from 'react';
// IMPORTA O TIPO 'Lead' DA NOSSA FONTE CENTRAL DA VERDADE.
import { type Lead } from '@/lib/types';

// Interface para a resposta paginada da API.
export interface PaginatedLeadsResponse {
  items: Lead[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Hook customizado para buscar e gerenciar os dados de leads.
 * Ele lida com estado de carregamento, erros e a busca de dados paginados.
 */
export function useLeads(page: number = 1, limit: number = 10) {
  const [items, setItems] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/leads?page=${page}&limit=${limit}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao carregar leads.');
      }
      const result = await response.json();
      
      // O resultado agora é tratado com o tipo 'Lead' correto e completo.
      setItems(result.items || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar leads.');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Retorna os dados e controles para o componente que o utiliza.
  return { items, total, loading, error, refetch: fetchLeads };
}