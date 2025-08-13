"use server";

/**
 * @file src/actions/campaignActions.ts
 * @description Server Actions para o gerenciamento completo de Campanhas, incluindo validação de CSV e disparo.
 *
 * @version 2.2.0 (Correção no status de criação de leads)
 * @author Gemini Dev Lead & Lucas Trombeli
 *
 * @features
 * - Sintaxe de try/catch corrigida em todas as funções.
 * - Lógica de segurança multi-tenant aplicada a todas as funções.
 * - Action `validateCampaignCSV` para validar listas de leads antes da importação.
 * - `createCampaignWithLeads` processa o CSV e cria leads em massa de forma segura.
 * - Action `runCampaign` para iniciar o processo de disparo de forma assíncrona com Inngest.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  type Campaign, 
  type CampaignUpdate,
  type LeadCreate
} from "@/lib/types";
import { inngest } from "@/inngest/client";

async function getAuthenticatedClient() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Ação não autorizada: Usuário não autenticado.");

  const { data: clientUser, error } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('user_id', user.id)
    .single();
  if (error || !clientUser) throw new Error("Ação não autorizada: Empresa não encontrada para este usuário.");
  
  return { supabase, user, clientId: clientUser.client_id };
}

// ============================================================================
// NOVAS ACTIONS PARA O FLUXO DE CAMPANHA
// ============================================================================

export async function validateCampaignCSV(formData: FormData): Promise<{ 
  success: boolean;
  data?: {
    total_rows: number;
    valid_leads: number;
    duplicate_phones: number;
    invalid_phones: number;
  };
  error?: string;
}> {
  try {
    const file = formData.get('csv_file') as File;
    if (!file) throw new Error("Nenhum arquivo CSV foi enviado para validação.");

    const text = await file.text();
    const rows = text.split('\n').filter(row => row.trim() !== '');
    if (rows.length === 0) throw new Error("O arquivo CSV está vazio ou em um formato inválido.");

    const headerRow = rows.shift();
    if (!headerRow) throw new Error("O arquivo CSV não contém uma linha de cabeçalho.");
    
    const header = headerRow.split(',').map(h => h.trim().toLowerCase());
    
    if (!header.includes('telefone')) {
      throw new Error("O arquivo CSV precisa ter uma coluna de cabeçalho chamada 'telefone'.");
    }
    
    const phoneIndex = header.indexOf('telefone');
    let validLeads = 0;
    let invalidPhones = 0;
    let duplicatePhones = 0;
    const seenPhones = new Set<string>();

    for (const row of rows) {
      const columns = row.split(',');
      const phone = columns[phoneIndex]?.trim().replace(/\D/g, '');

      if (!phone || phone.length < 10) {
        invalidPhones++;
        continue;
      }
      
      if (seenPhones.has(phone)) {
        duplicatePhones++;
        continue;
      }
      
      seenPhones.add(phone);
      validLeads++;
    }
    
    return { 
      success: true,
      data: {
        total_rows: rows.length,
        valid_leads: validLeads,
        duplicate_phones: duplicatePhones,
        invalid_phones: invalidPhones
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido durante a validação.";
    console.error("ERRO em validateCampaignCSV:", error);
    return { success: false, error: errorMessage };
  }
}

export async function createCampaignWithLeads(formData: FormData): Promise<{ data: Campaign | null; error: string | null }> {
  let supabase, clientId;
  let newCampaignId: string | null = null;
  
  try {
    const authData = await getAuthenticatedClient();
    supabase = authData.supabase;
    clientId = authData.clientId;

    const name = formData.get('name') as string;
    const template_name = formData.get('template_name') as string;
    const system_prompt_id = formData.get('system_prompt_id') as string;
    const file = formData.get('csv_file') as File;

    if (!name || !template_name || !file) {
      throw new Error("Nome da campanha, nome do template e arquivo CSV são obrigatórios.");
    }
    
    const { data: newCampaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({ name, template_name, system_prompt_id: system_prompt_id || null, client_id: clientId, status: 'DRAFT' })
      .select('id')
      .single();

    if (campaignError || !newCampaign) throw campaignError || new Error("Falha ao registrar a campanha no banco de dados.");
    newCampaignId = newCampaign.id;

    const text = await file.text();
    const rows = text.split('\n').filter(row => row.trim() !== '');
    const headerRow = rows.shift();
    if (!headerRow) throw new Error("O arquivo CSV não contém um cabeçalho.");
    const header = headerRow.split(',').map(h => h.trim().toLowerCase());
    if (!header.includes('telefone')) throw new Error("CSV inválido: coluna 'telefone' não encontrada.");
    
    const phoneIndex = header.indexOf('telefone');
    const leadsToInsert: Omit<LeadCreate, 'status'>[] = [];
    const seenPhones = new Set<string>();
    
    for (const row of rows) {
      const columns = row.split(',').map(col => col.trim());
      const phone = columns[phoneIndex]?.replace(/\D/g, '');
      
      if (phone && phone.length >= 10 && !seenPhones.has(phone)) {
        seenPhones.add(phone);
        const customData: { [key: string]: string } = {};
        header.forEach((h, i) => { customData[h] = columns[i] ?? ""; });
        leadsToInsert.push({ client_id: clientId, campaign_id: newCampaignId, phone, name: customData['name'] || `Lead ${phone}`, email: customData['email'] || null, company: customData['company'] || null, position: customData['position'] || null, custom_data: customData });
      }
    }

    if (leadsToInsert.length === 0) throw new Error("Nenhum lead válido encontrado no arquivo CSV para ser importado.");

    // ==================================================================
    // CORREÇÃO APLICADA AQUI
    // O status dos leads importados foi alterado de 'DRAFT' para 'NEW'.
    // O erro ocorria porque 'DRAFT' não é um status válido para um lead, apenas para uma campanha.
    // 'NEW' (Novo) é o status inicial correto para um lead recém-importado.
    // ==================================================================
    const { error: leadsError } = await supabase.from('leads').insert(leadsToInsert.map(lead => ({ ...lead, status: 'NEW' })));
    if (leadsError) throw leadsError;
    
    const { data: updatedCampaign, error: updateError } = await supabase
        .from('campaigns')
        .update({ leads_count: leadsToInsert.length, status: 'ACTIVE' })
        .eq('id', newCampaignId)
        .select()
        .single();
    
    if (updateError) throw updateError;
    
    revalidatePath("/campaigns");
    return { data: updatedCampaign as Campaign, error: null };

  } catch (error) {
    if (newCampaignId && supabase) {
      await supabase.from('campaigns').delete().eq('id', newCampaignId);
    }
    const errorMessage = error instanceof Error ? error.message : "Erro ao criar campanha com leads.";
    console.error("ERRO em createCampaignWithLeads:", error);
    return { data: null, error: errorMessage };
  }
}

// ... (O restante do arquivo permanece igual)
export async function runCampaign(campaignId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { supabase, clientId } = await getAuthenticatedClient();

    const { data: campaign, error: updateError } = await supabase
      .from('campaigns')
      .update({ status: 'PROCESSING' })
      .eq('id', campaignId)
      .eq('client_id', clientId)
      .eq('status', 'ACTIVE')
      .select()
      .single();
    
    if (updateError || !campaign) {
      throw new Error("Campanha não encontrada ou não está pronta para ser disparada.");
    }
    
    await inngest.send({ name: "campaign/process", data: { campaignId: campaign.id } });

    revalidatePath("/campaigns");
    return { success: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao iniciar campanha.";
    console.error("ERRO em runCampaign:", error);
    return { success: false, error: errorMessage };
  }
}

export async function getCampaigns(): Promise<{ data: Campaign[] | null; error: string | null }> {
  try {
    const { supabase, clientId } = await getAuthenticatedClient();
    const { data, error } = await supabase
      .from('campaigns')
      .select(`*, system_prompts:system_prompt_id (name)`)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const campaignsWithPromptNames = data?.map((campaign: any) => ({
      ...campaign,
      system_prompt_name: campaign.system_prompts?.name || null,
    }));

    return { data: campaignsWithPromptNames as Campaign[], error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar campanhas.";
    return { data: null, error: errorMessage };
  }
}

export async function deleteCampaign(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { supabase, clientId } = await getAuthenticatedClient();
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId);

    if (error) throw error;

    revalidatePath("/campaigns");
    return { success: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao deletar campanha.";
    return { success: false, error: errorMessage };
  }
}

export async function updateCampaign(id: string, campaignData: Partial<CampaignUpdate>): Promise<{ data: Campaign | null; error: string | null }> {
  try {
    const { supabase, clientId } = await getAuthenticatedClient();

    const { data, error } = await supabase
      .from('campaigns')
      .update({ ...campaignData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) throw error;
    
    revalidatePath("/campaigns");
    return { data: data as Campaign, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar campanha.";
    return { data: null, error: errorMessage };
  }
}