import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Consultant {
  id: string;
  client_id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  is_active: boolean;
  calendar_connected: boolean;
  calendar_type?: 'google' | 'microsoft' | null;
  calendar_account_id?: string;
  created_at: string;
  updated_at: string;
  leads_count?: number;
  meetings_count?: number;
}

export interface ConsultantCreate {
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
}

export interface ConsultantUpdate {
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
}

export function useConsultants() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsultants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Consultant[]>('/consultants');
      setConsultants(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Falha ao carregar consultores.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createConsultant = useCallback(async (data: ConsultantCreate) => {
    const response = await api.post<Consultant>('/consultants', data);
    await fetchConsultants();
    return response.data;
  }, [fetchConsultants]);
  
  const updateConsultant = useCallback(async (id: string, data: ConsultantUpdate) => {
    const response = await api.put<Consultant>(`/consultants/${id}`, data);
    await fetchConsultants();
    return response.data;
  }, [fetchConsultants]);

  const deleteConsultant = useCallback(async (id: string) => {
    await api.delete(`/consultants/${id}`);
    await fetchConsultants();
  }, [fetchConsultants]);

  const toggleActive = useCallback(async (id: string) => {
    const consultant = consultants.find(c => c.id === id);
    if (consultant) {
      await api.put(`/consultants/${id}`, { is_active: !consultant.is_active });
      await fetchConsultants();
    }
  }, [consultants, fetchConsultants]);

  useEffect(() => {
    fetchConsultants();
  }, [fetchConsultants]);

  return {
    consultants,
    loading,
    error,
    createConsultant,
    updateConsultant,
    deleteConsultant,
    toggleActive,
    refetch: fetchConsultants,
  };
}

