"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  LeadSchema, 
  LeadCreateSchema, 
  LeadUpdateSchema,
  type Lead, 
  type LeadCreate, 
  type LeadUpdate 
} from "@/lib/types";

/**
 * Busca todos os leads do cliente logado com filtros opcionais
 */
export async function getLeads(params?: {
  campaign_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Lead[] | null; error: string | null; total: number }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    // MUDANÇA 1: Define valores padrão para a paginação
    const { page = 1, limit = 10, ...filters } = params || {};
    const from = (page - 1) * limit;
    const to = page * limit - 1;

    let query = supabase
      .from('leads')
      .select(`
        *,
        campaigns:campaign_id (id, name),
        consultants:consultant_id (id, name)
      `, { count: 'exact' }) // MUDANÇA 2: Pede ao Supabase para contar o total de itens
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.campaign_id) {
      query = query.eq('campaign_id', filters.campaign_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }

    // MUDANÇA 3: Aplica o range da paginação
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const leadsWithRelations = data?.map((lead: any) => ({
      ...lead,
      campaign_name: lead.campaigns?.name || null,
      consultant_name: lead.consultants?.name || null,
    }));

    // MUDANÇA 4: Retorna os dados e o total
    return { data: leadsWithRelations as Lead[], error: null, total: count || 0 };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar leads.";
    console.error("ERRO em getLeads:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage, total: 0 };
  }
}

/**
 * Cria um novo lead
 */
export async function createLead(leadData: LeadCreate): Promise<{ data: Lead | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    // Validação dos dados de entrada
    const validatedData = LeadCreateSchema.safeParse(leadData);
    if (!validatedData.success) {
      const errorMessages = validatedData.error.issues
        .map((issue) => issue.message)
        .join(", ");
      throw new Error(`Erro de validação: ${errorMessages}`);
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({ 
        ...validatedData.data, 
        client_id: user.id 
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    revalidatePath("/(protected)/(shell)/leads");
    return { data: data as Lead, error: null };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao criar lead.";
    console.error("ERRO em createLead:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

/**
 * Atualiza um lead existente
 */
export async function updateLead(id: string, leadData: LeadUpdate): Promise<{ data: Lead | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    // Validação dos dados de entrada
    const validatedData = LeadUpdateSchema.safeParse(leadData);
    if (!validatedData.success) {
      const errorMessages = validatedData.error.issues
        .map((issue) => issue.message)
        .join(", ");
      throw new Error(`Erro de validação: ${errorMessages}`);
    }

    const { data, error } = await supabase
      .from('leads')
      .update({ 
        ...validatedData.data, 
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('client_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    revalidatePath("/(protected)/(shell)/leads");
    return { data: data as Lead, error: null };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar lead.";
    console.error("ERRO em updateLead:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

/**
 * Busca um lead específico pelo ID
 */
export async function getLeadById(id: string): Promise<{ data: Lead | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        campaigns:campaign_id (
          id,
          name
        ),
        consultants:consultant_id (
          id,
          name
        )
      `)
      .eq('id', id)
      .eq('client_id', user.id)
      .single();

    if (error) {
      throw error;
    }

    // Mapeia os dados para incluir nomes das campanhas e consultores
    const leadWithRelations = {
      ...data,
      campaign_name: data.campaigns?.name || null,
      consultant_name: data.consultants?.name || null,
    };

    return { data: leadWithRelations as Lead, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar lead.";
    console.error("ERRO em getLeadById:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

/**
 * Deleta um lead
 */
export async function deleteLead(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('client_id', user.id);

    if (error) {
      throw error;
    }

    revalidatePath("/(protected)/(shell)/leads");
    return { success: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao deletar lead.";
    console.error("ERRO em deleteLead:", { message: errorMessage, errorObject: error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Atualiza o status de múltiplos leads
 */
export async function updateLeadsStatus(leadIds: string[], status: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const { error } = await supabase
      .from('leads')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .in('id', leadIds)
      .eq('client_id', user.id);

    if (error) {
      throw error;
    }

    revalidatePath("/(protected)/(shell)/leads");
    return { success: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar status dos leads.";
    console.error("ERRO em updateLeadsStatus:", { message: errorMessage, errorObject: error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Associa múltiplos leads a uma campanha
 */
export async function assignLeadsToCampaign(leadIds: string[], campaignId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const { error } = await supabase
      .from('leads')
      .update({ 
        campaign_id: campaignId,
        updated_at: new Date().toISOString()
      })
      .in('id', leadIds)
      .eq('client_id', user.id);

    if (error) {
      throw error;
    }

    revalidatePath("/(protected)/(shell)/leads");
    return { success: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao associar leads à campanha.";
    console.error("ERRO em assignLeadsToCampaign:", { message: errorMessage, errorObject: error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Associa múltiplos leads a um consultor
 */
export async function assignLeadsToConsultant(leadIds: string[], consultantId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const { error } = await supabase
      .from('leads')
      .update({ 
        consultant_id: consultantId,
        updated_at: new Date().toISOString()
      })
      .in('id', leadIds)
      .eq('client_id', user.id);

    if (error) {
      throw error;
    }

    revalidatePath("/(protected)/(shell)/leads");
    return { success: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao associar leads ao consultor.";
    console.error("ERRO em assignLeadsToConsultant:", { message: errorMessage, errorObject: error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Importa leads de um arquivo CSV
 */
export async function importLeadsFromCSV(csvData: string, campaignId?: string): Promise<{ 
  success: boolean; 
  imported: number; 
  errors: string[]; 
  error: string | null 
}> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    // Parse do CSV
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error("Arquivo CSV deve conter pelo menos um cabeçalho e uma linha de dados.");
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'phone'];
    
    // Verifica se os cabeçalhos obrigatórios estão presentes
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Cabeçalhos obrigatórios ausentes: ${missingHeaders.join(', ')}`);
    }

    const leadsToImport: LeadCreate[] = [];
    const errors: string[] = [];

    // Processa cada linha do CSV
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        errors.push(`Linha ${i + 1}: Número de colunas não confere com o cabeçalho`);
        continue;
      }

      const leadData: any = { client_id: user.id };
      
      headers.forEach((header, index) => {
        leadData[header] = values[index];
      });

      // Adiciona campanha se fornecida
      if (campaignId) {
        leadData.campaign_id = campaignId;
      }

      // Validação básica
      if (!leadData.name || !leadData.phone) {
        errors.push(`Linha ${i + 1}: Nome e telefone são obrigatórios`);
        continue;
      }

      // Validação com schema
      const validatedData = LeadCreateSchema.safeParse(leadData);
      if (!validatedData.success) {
        errors.push(`Linha ${i + 1}: ${validatedData.error.issues.map(issue => issue.message).join(', ')}`);
        continue;
      }

      leadsToImport.push(validatedData.data);
    }

    // Importa os leads válidos
    let imported = 0;
    if (leadsToImport.length > 0) {
      const { data, error } = await supabase
        .from('leads')
        .insert(leadsToImport)
        .select();

      if (error) {
        throw error;
      }

      imported = data?.length || 0;
    }

    revalidatePath("/(protected)/(shell)/leads");
    return { 
      success: true, 
      imported, 
      errors, 
      error: null 
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao importar leads.";
    console.error("ERRO em importLeadsFromCSV:", { message: errorMessage, errorObject: error });
    return { 
      success: false, 
      imported: 0, 
      errors: [], 
      error: errorMessage 
    };
  }
}

/**
 * Gera um template CSV para download
 */
export async function generateCSVTemplate(): Promise<string> {
  const headers = ['name', 'phone', 'email', 'company', 'position'];
  const sampleData = [
    'João Silva,11999999999,joao@empresa.com,Empresa ABC,Gerente',
    'Maria Santos,11888888888,maria@empresa.com,Empresa XYZ,Diretora'
  ];
  
  return [headers.join(','), ...sampleData].join('\n');
}

