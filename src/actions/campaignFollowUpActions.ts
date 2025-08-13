"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Busca leads frios por campanha (leads que não responderam há mais de X dias)
 */
export async function getColdLeadsByCampaign(campaignId: string, daysSinceLastMessage: number = 3): Promise<{ 
  data: any[] | null; 
  error: string | null 
}> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    // Chama a função RPC do banco de dados
    const { data, error } = await supabase.rpc('get_cold_leads_by_campaign', {
      p_campaign_id: campaignId,
      p_days_since_last_message: daysSinceLastMessage
    });

    if (error) {
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar leads frios.";
    console.error("ERRO em getColdLeadsByCampaign:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

/**
 * Dispara campanha de reaquecimento para leads frios
 */
export async function triggerReactivationCampaign(campaignId: string, leadIds: string[], messageTemplate?: string): Promise<{ 
  success: boolean; 
  triggered: number;
  error: string | null 
}> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    // Verifica se a campanha pertence ao usuário
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('id', campaignId)
      .eq('client_id', user.id)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campanha não encontrada ou não autorizada.");
    }

    // Atualiza os leads para marcar que foram incluídos na campanha de reaquecimento
    const { data: updatedLeads, error: updateError } = await supabase
      .from('leads')
      .update({ 
        status: 'REACTIVATION_SENT',
        updated_at: new Date().toISOString()
      })
      .in('id', leadIds)
      .eq('client_id', user.id)
      .select();

    if (updateError) {
      throw updateError;
    }

    // Aqui você pode integrar com o sistema de envio de mensagens (Inngest, etc.)
    // Por enquanto, vamos simular o disparo
    const triggered = updatedLeads?.length || 0;

    // TODO: Integrar com Inngest para disparar as mensagens de reaquecimento
    // await inngest.send({
    //   name: "reactivation-campaign/trigger",
    //   data: {
    //     campaignId,
    //     leadIds,
    //     messageTemplate,
    //     clientId: user.id
    //   }
    // });

    revalidatePath("/(protected)/(shell)/campaigns");
    revalidatePath("/(protected)/(shell)/leads");
    
    return { 
      success: true, 
      triggered,
      error: null 
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao disparar campanha de reaquecimento.";
    console.error("ERRO em triggerReactivationCampaign:", { message: errorMessage, errorObject: error });
    return { 
      success: false, 
      triggered: 0,
      error: errorMessage 
    };
  }
}

/**
 * Busca estatísticas de campanhas de follow-up
 */
export async function getFollowUpStats(campaignId?: string): Promise<{ 
  data: {
    totalLeads: number;
    coldLeads: number;
    reactivationSent: number;
    responded: number;
  } | null; 
  error: string | null 
}> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    let query = supabase
      .from('leads')
      .select('status, campaign_id')
      .eq('client_id', user.id);

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data: leads, error } = await query;

    if (error) {
      throw error;
    }

    const stats = {
      totalLeads: leads?.length || 0,
      coldLeads: leads?.filter(lead => lead.status === 'COLD').length || 0,
      reactivationSent: leads?.filter(lead => lead.status === 'REACTIVATION_SENT').length || 0,
      responded: leads?.filter(lead => ['QUALIFIED', 'MEETING_SCHEDULED', 'CLOSED_WON'].includes(lead.status)).length || 0,
    };

    return { data: stats, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar estatísticas de follow-up.";
    console.error("ERRO em getFollowUpStats:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

/**
 * Agenda campanha de follow-up para execução futura
 */
export async function scheduleFollowUpCampaign(
  campaignId: string, 
  scheduledFor: string, 
  messageTemplate?: string
): Promise<{ 
  success: boolean; 
  error: string | null 
}> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    // Verifica se a campanha pertence ao usuário
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('id', campaignId)
      .eq('client_id', user.id)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campanha não encontrada ou não autorizada.");
    }

    // Cria um registro de agendamento (você pode criar uma tabela específica para isso)
    const { error: scheduleError } = await supabase
      .from('scheduled_campaigns')
      .insert({
        campaign_id: campaignId,
        client_id: user.id,
        scheduled_for: scheduledFor,
        message_template: messageTemplate,
        status: 'SCHEDULED',
        created_at: new Date().toISOString()
      });

    if (scheduleError) {
      throw scheduleError;
    }

    // TODO: Integrar com Inngest para agendar a execução
    // await inngest.send({
    //   name: "follow-up-campaign/schedule",
    //   data: {
    //     campaignId,
    //     scheduledFor,
    //     messageTemplate,
    //     clientId: user.id
    //   }
    // });

    revalidatePath("/(protected)/(shell)/campaigns");
    
    return { 
      success: true, 
      error: null 
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao agendar campanha de follow-up.";
    console.error("ERRO em scheduleFollowUpCampaign:", { message: errorMessage, errorObject: error });
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

