// Caminho: src/actions/dashboardActions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { inngest } from "@/inngest/client";

// ========================================================================
// INTERFACES E TIPOS PÚBLICOS
// ========================================================================

// Esta é a "interface contrato" que o dashboard espera. Nossa função DEVE retornar um objeto com este formato.
export interface DashboardStats {
  total_leads: number;
  new_leads_today: number;
  messages_sent: number;
  messages_sent_today: number;
  response_rate: number;
  responses_received: number;
  meetings_scheduled: number;
  meetings_today: number;
  active_campaigns: number;
  total_campaigns: number;
  pending_leads: number;
  conversions: number;
  conversion_rate: number;
}

export interface ActionableInsight {
  type: 'INITIAL_CONTACT_FOLLOW_UP';
  title: string;
  description: string;
  leadCount: number;
  leadIds: string[];
  campaignId: string;
  campaignName: string;
}

// ========================================================================
// FUNÇÃO AUXILIAR DE SEGURANÇA
// ========================================================================

async function getAuthenticatedClient() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Ação não autorizada: Usuário não autenticado.");
  }

  const { data: clientUser, error } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('user_id', user.id)
    .single();

  if (error || !clientUser?.client_id) {
    throw new Error("Ação não autorizada: Empresa não encontrada para este usuário.");
  }

  return { supabase, user, clientId: clientUser.client_id };
}


// ========================================================================
// AÇÃO PRINCIPAL DO DASHBOARD (VERSÃO CORRIGIDA E COMPLETA)
// ========================================================================

/**
 * VERSÃO CORRIGIDA: Busca TODOS os dados de resumo do dashboard.
 * Esta função foi expandida para calcular todas as métricas necessárias.
 */
export async function getDashboardSummary(period: string): Promise<{ data: DashboardStats | null; error: string | null }> {
  try {
    const { supabase, clientId } = await getAuthenticatedClient();

    const getStartDate = (p: string): Date => {
      const now = new Date();
      const days = parseInt(p.replace('d', '')) || 30; // Padrão de 30 dias se 'p' for inválido
      now.setDate(now.getDate() - days);
      return now;
    };
    
    const startDate = getStartDate(period).toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartISO = todayStart.toISOString();

    // ==================================================================
    // NOVAS QUERIES PARA BUSCAR TODAS AS MÉTRICAS NECESSÁRIAS
    // Usamos Promise.all para rodar as buscas em paralelo, o que é mais eficiente.
    // ==================================================================
    const [
      totalLeadsRes,
      newLeadsTodayRes,
      messagesSentRes,
      messagesSentTodayRes,
      responsesReceivedRes,
      meetingsScheduledRes,
      meetingsTodayRes,
      activeCampaignsRes,
      totalCampaignsRes,
      pendingLeadsRes,
      conversionsRes
    ] = await Promise.all([
      // total_leads
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('client_id', clientId).gte('created_at', startDate),
      // new_leads_today
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('client_id', clientId).gte('created_at', todayStartISO),
      // messages_sent
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('direction', 'outbound').gte('created_at', startDate),
      // messages_sent_today
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('direction', 'outbound').gte('created_at', todayStartISO),
      // responses_received
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('direction', 'inbound').gte('created_at', startDate),
      // meetings_scheduled
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'MEETING_SCHEDULED').gte('created_at', startDate),
       // meetings_today
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'MEETING_SCHEDULED').gte('scheduled_at', todayStartISO),
      // active_campaigns
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('client_id', clientId).in('status', ['ACTIVE', 'PROCESSING']),
      // total_campaigns
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
      // pending_leads
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('client_id', clientId).in('status', ['NEW', 'CONTACTED']).gte('created_at', startDate),
      // conversions
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('client_id', clientId).in('status', ['MEETING_SCHEDULED', 'CLOSED_WON']).gte('created_at', startDate)
    ]);
    
    // Extraindo as contagens e tratando possíveis erros
    const total_leads = totalLeadsRes.count ?? 0;
    if (totalLeadsRes.error) throw totalLeadsRes.error;
    
    const messages_sent = messagesSentRes.count ?? 0;
    const responses_received = responsesReceivedRes.count ?? 0;
    const conversions = conversionsRes.count ?? 0;
    
    // ==================================================================
    // CÁLCULOS DAS TAXAS E MÉTRICAS
    // ==================================================================
    const response_rate = messages_sent > 0 ? (responses_received / messages_sent) : 0;
    const conversion_rate = total_leads > 0 ? (conversions / total_leads) : 0;
    
    const summaryData: DashboardStats = {
      total_leads: total_leads,
      new_leads_today: newLeadsTodayRes.count ?? 0,
      messages_sent: messages_sent,
      messages_sent_today: messagesSentTodayRes.count ?? 0,
      response_rate: response_rate,
      responses_received: responses_received,
      meetings_scheduled: meetingsScheduledRes.count ?? 0,
      meetings_today: meetingsTodayRes.count ?? 0,
      active_campaigns: activeCampaignsRes.count ?? 0,
      total_campaigns: totalCampaignsRes.count ?? 0,
      pending_leads: pendingLeadsRes.count ?? 0,
      conversions: conversions,
      conversion_rate: conversion_rate,
    };

    return { data: summaryData, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Falha ao buscar resumo do dashboard.";
    console.error("ERRO em getDashboardSummary:", error);
    return { data: null, error: errorMessage };
  }
}


// ========================================================================
// AÇÕES ANTIGAS E AUXILIARES (Mantidas para outras partes do sistema)
// ========================================================================

/**
 * RESTAURADO: Busca as próximas reuniões agendadas.
 */
export async function getUpcomingEvents() {
    try {
        const { supabase, clientId } = await getAuthenticatedClient();
        const { data, error } = await supabase
            .from('leads')
            .select('id, name, scheduled_at, consultant:consultant_id (name)')
            .eq('client_id', clientId)
            .eq('status', 'MEETING_SCHEDULED')
            .gte('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(5);

        if (error) throw error;

        const events = data.map((lead: any) => ({
            id: lead.id,
            title: `Reunião com ${lead.name}`,
            scheduled_at: lead.scheduled_at,
            consultant_name: lead.consultant?.name || 'N/A',
        }));
        return { data: events, error: null };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Falha ao buscar próximos eventos.";
        return { data: [], error: errorMessage };
    }
}

/**
 * RESTAURADO: Busca as atividades mais recentes.
 */
export async function getRecentActivity() {
  try {
    const { supabase, clientId } = await getAuthenticatedClient();
    const { data, error } = await supabase
        .from('leads')
        .select('id, name, created_at, email')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) throw error;

    const activities = data.map(lead => ({
        id: lead.id,
        type: "novo_lead",
        description: "Novo lead cadastrado",
        details: `Lead: ${lead.name} (${lead.email || 'sem email'})`,
        timestamp: lead.created_at,
    }));
    return { data: activities, error: null };
  } catch(error) {
      const errorMessage = error instanceof Error ? error.message : "Falha ao buscar atividades recentes.";
      return { data: [], error: errorMessage };
  }
}

export async function getActionableInsights(): Promise<{ data: ActionableInsight[] | null; error: string | null }> {
  try {
    const { supabase, clientId } = await getAuthenticatedClient();
    const insights: ActionableInsight[] = [];

    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('client_id', clientId)
      .in('status', ['PROCESSING', 'ACTIVE', 'COMPLETED']);

    if (campaignsError) {
      console.error("Erro ao buscar campanhas para insights:", campaignsError);
      throw campaignsError;
    }

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    for (const campaign of campaigns) {
      const { data: unansweredLeads, error: leadsError } = await supabase
        .from('leads')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('status', 'CONTACTED')
        .is('last_incoming_message_at', null)
        .lt('initial_template_attempts', 3)
        .lte('last_outgoing_message_at', twoDaysAgo.toISOString());

      if (leadsError) {
        console.error(`Erro ao buscar leads para a campanha ${campaign.name}:`, leadsError);
        continue;
      }

      if (unansweredLeads && unansweredLeads.length > 0) {
        insights.push({
          type: 'INITIAL_CONTACT_FOLLOW_UP',
          title: `Reativar Leads - ${campaign.name}`,
          description: `${unansweredLeads.length} leads da campanha "${campaign.name}" não responderam ao contato inicial. Envie um novo template para tentar engajá-los.`,
          leadCount: unansweredLeads.length,
          leadIds: unansweredLeads.map(l => l.id),
          campaignId: campaign.id,
          campaignName: campaign.name,
        });
      }
    }

    return { data: insights, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao buscar insights.";
    console.error("ERRO em getActionableInsights:", error);
    return { data: null, error: errorMessage };
  }
}

export async function startFollowUpCampaign(leadIds: string[], templateName: string) {
  "use server";
  try {
    const { supabase, clientId } = await getAuthenticatedClient();

    const { error: rpcError } = await supabase.rpc('increment_template_attempts', { p_lead_ids: leadIds });
    if (rpcError) {
        console.error("Erro ao incrementar tentativas via RPC:", rpcError);
        throw rpcError;
    }

    await inngest.send({
      name: "follow-up/start",
      data: {
        leadIds: leadIds,
        templateName: templateName,
        clientId: clientId,
      },
    });

    revalidatePath('/dashboard');
    return { success: true, message: "Campanha de follow-up enviada para a fila de processamento." };
  } catch(error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao iniciar campanha de follow-up.";
    console.error("ERRO em startFollowUpCampaign:", error);
    return { success: false, error: errorMessage };
  }
}

export async function getNotifications() {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    const { data, error } = await supabase
      .from('notifications')
      .select(`id, message, type, is_read, created_at, related_lead_id, leads:related_lead_id(name, phone)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Falha ao buscar notificações.";
    return { data: [], error: errorMessage };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  "use server";
  try {
    const { supabase, user } = await getAuthenticatedClient();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) throw error;
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Falha ao marcar notificação como lida.";
    return { success: false, error: errorMessage };
  }
}

export async function markAllNotificationsAsRead() {
  "use server";
  try {
    const { supabase, user } = await getAuthenticatedClient();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Falha ao marcar todas as notificações.";
    return { success: false, error: errorMessage };
  }
}

export async function getTodaysMeetings() {
  try {
    const { supabase, clientId } = await getAuthenticatedClient();
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const { data, error } = await supabase
      .from('leads')
      .select(`id, name, phone, scheduled_at, consultant_id, consultants:consultant_id (name, email)`)
      .eq('client_id', clientId)
      .eq('status', 'MEETING_SCHEDULED')
      .gte('scheduled_at', startOfDay)
      .lt('scheduled_at', endOfDay)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Falha ao buscar reuniões de hoje.";
    return { data: [], error: errorMessage };
  }
}