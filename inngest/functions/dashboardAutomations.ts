// Caminho: src/inngest/functions/dashboardAutomations.ts

import { inngest } from "../client";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppTemplateMessage } from "@/lib/whatsapp";

/**
 * Função Inngest que lida com o evento 'follow-up/start',
 * disparado pela Central de Ações do Dashboard.
 * Esta função é a executora final da campanha de reativação.
 */
export const handleFollowUpStart = inngest.createFunction(
  { 
    id: "handle-dashboard-follow-up", 
    name: "Handle Dashboard Follow-up Campaign",
    retries: 3 // Tenta novamente até 3 vezes em caso de falha
  },
  { event: "follow-up/start" }, // Gatilho: escuta o evento 'follow-up/start'
  async ({ event, step }) => {
    // ==================================================================
    // CORREÇÃO APLICADA AQUI
    // ==================================================================
    // A variável foi trocada de 'templateSuggestion' para 'templateName'
    // para corresponder exatamente ao que definimos no nosso contrato (client.ts)
    // e ao que o modal do usuário envia.
    const { leadIds, templateName, clientId } = event.data;
    const supabase = createClient();

    console.log(`[Inngest] Iniciando campanha de follow-up para ${leadIds.length} leads com o template: ${templateName}`);

    // O loop 'for' processa cada lead individualmente.
    for (const leadId of leadIds) {
      // Usar 'step.run' para cada lead torna o processo resiliente.
      await step.run(`send-follow-up-to-${leadId}`, async () => {
        // 1. Busca os detalhes do lead no banco de dados.
        const { data: lead, error } = await supabase
          .from("leads")
          .select("phone, name")
          .eq("id", leadId)
          .single();

        if (error) throw new Error(`Falha ao buscar lead ${leadId}: ${error.message}`);
        if (!lead?.phone) {
          console.warn(`Lead ${leadId} não possui número de telefone. Pulando.`);
          return { status: "skipped", reason: "No phone number" };
        }

        // 2. Monta os componentes para o template do WhatsApp.
        // Isso assume que o template pode usar o nome do lead como uma variável.
        const components = [{
          "type": "body",
          "parameters": [
            { "type": "text", "text": lead.name || "cliente" }
          ]
        }];

        // 3. Envia a mensagem de template via WhatsApp, usando o nome do template escolhido pelo usuário.
        await sendWhatsAppTemplateMessage(
          lead.phone,
          templateName, // <-- Variável corrigida sendo usada aqui
          components
        );

        // 4. Atualiza o lead no banco de dados para registrar que o follow-up foi enviado.
        const sentTimestamp = new Date().toISOString();
        await supabase
          .from("leads")
          .update({ 
            last_followup_at: sentTimestamp,
            updated_at: sentTimestamp,
            last_outgoing_message_at: sentTimestamp
          })
          .eq("id", leadId);
        
        return { status: "success", leadId: leadId };
      });

      // Adiciona uma pequena pausa para não sobrecarregar a API do WhatsApp.
      await step.sleep(`wait-after-${leadId}`, "1s");
    }

    return { status: "Completed", message: `${leadIds.length} follow-ups processados.` };
  }
);


/**
 * Função Inngest que lida com o evento 'reactivation/start',
 * disparado após a criação de uma campanha de reaquecimento.
 * O objetivo desta função é pegar a campanha recém-criada (que está em 'DRAFT')
 * e prepará-la para o disparo, reutilizando a lógica já existente.
 */
export const handleReactivationStart = inngest.createFunction(
  { 
    id: "handle-dashboard-reactivation", 
    name: "Handle Dashboard Reactivation Campaign",
    retries: 2
  },
  { event: "reactivation/start" },
  async ({ event, step }) => {
    const { insight } = event.data;
    const campaignId = insight.campaignId;

    if (!campaignId) {
      throw new Error("Insight de reativação não continha um ID de campanha.");
    }

    const supabase = createClient();

    // 1. Ativa a campanha que foi criada como 'DRAFT'
    await step.run(`activate-reactivation-campaign-${campaignId}`, async () => {
      const { error } = await supabase
        .from("campaigns")
        .update({ status: 'ACTIVE', updated_at: new Date().toISOString() })
        .eq("id", campaignId);
      
      if (error) throw new Error(`Falha ao ativar campanha de reativação ${campaignId}: ${error.message}`);
    });

    // 2. Reutiliza a lógica existente! Dispara o evento 'campaign/process'
    // que a função 'processCampaign' já sabe como manusear.
    await step.sendEvent(`trigger-campaign-process-${campaignId}`, {
      name: "campaign/process",
      data: {
        campaignId: campaignId,
      },
    });

    console.log(`[Inngest] Campanha de reativação ${campaignId} ativada e enviada para processamento.`);

    return { status: "Success", campaignId: campaignId };
  }
);
