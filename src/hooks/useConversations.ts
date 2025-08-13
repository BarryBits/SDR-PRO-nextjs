import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

// Tipagem para uma única mensagem
export interface Message {
  id: string;
  lead_id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  media_url?: string;
  media_type?: string;
  created_at: string;
}

// Tipagem para o objeto de conversação completo retornado pela API
export interface Conversation {
  lead_id: string;
  lead_name: string;
  lead_phone: string;
  lead_status: string;
  messages: Message[];
  total_messages: number;
  last_message_at: string;
}

/**
 * Hook para buscar uma única conversa detalhada por ID do Lead.
 * @param leadId - O ID do lead para o qual buscar a conversa. Pode ser nulo.
 */
export function useConversation(leadId: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Conversation>(`/messages/conversation/${id}`);
      setConversation(response.data);
    } catch (err: any) {
      console.error('Erro ao buscar conversa:', err);
      setError(err.response?.data?.detail || 'Não foi possível carregar o histórico da conversa.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // CORREÇÃO: A lógica de busca só é ativada se o leadId for uma string válida.
    if (leadId) {
      fetchConversation(leadId);
    } else {
      // Se o ID for nulo (ex: modal fechado), limpa os dados.
      setConversation(null);
      setLoading(false);
      setError(null);
    }
  }, [leadId, fetchConversation]);

  const refetch = () => {
    if (leadId) {
        fetchConversation(leadId);
    }
  }

  return {
    conversation,
    loading,
    error,
    refetch
  };
}