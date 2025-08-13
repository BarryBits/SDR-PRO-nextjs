import { inngest } from "../client";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppTemplateMessage } from "@/lib/whatsapp";

export const processCampaign = inngest.createFunction(
  // Configuração da função
  { 
    id: "process-campaign-function", 
    name: "Process and Send Campaign Messages",
    // Configura novas tentativas em caso de falha, essencial para robustez
    retries: 3 
  },

  // Gatilho que inicia a função
  { event: "campaign/process" },

  // A lógica principal da função
  async ({ event, step }) => {
    const { campaignId } = event.data;
    const supabase = createClient();

    // Passo 1: Buscar os detalhes da campanha e os leads associados
    const { campaign, leads } = await step.run("1-fetch-campaign-and-leads", async () => {
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select("id, name, template_name, client_id")
        .eq("id", campaignId)
        .single();

      if (campaignError) throw new Error(`Failed to fetch campaign: ${campaignError.message}`);
      if (!campaignData) throw new Error(`Campaign with ID ${campaignId} not found.`);

      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("id, name, phone")
        .eq("campaign_id", campaignId)
        .eq("status", "NEW"); // Apenas leads que ainda não foram contatados

      if (leadsError) throw new Error(`Failed to fetch leads: ${leadsError.message}`);
      
      return { campaign: campaignData, leads: leadsData || [] };
    });

    if (leads.length === 0) {
      // Se não houver leads para processar, atualiza a campanha para 'COMPLETED'
      await step.run("4-mark-campaign-as-completed-no-leads", async () => {
        await supabase
          .from("campaigns")
          .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
          .eq("id", campaignId);
      });
      return { status: "Completed", message: "No leads to process." };
    }

    // Passo 2: Iterar e enviar mensagem para cada lead
    for (const lead of leads) {
      // Usar um `step.run` para cada lead torna o processo mais resiliente.
      // Se falhar em um lead, o Inngest pode tentar novamente apenas para aquele lead.
      await step.run(`2-send-message-to-lead-${lead.id}`, async () => {
        if (!lead.phone) {
          console.warn(`Lead ${lead.id} (${lead.name}) has no phone number. Skipping.`);
          return;
        }

        // Monta a mensagem de template. Para o 'hello_world', não há variáveis.
        // Para templates mais complexos, você adicionaria `parameters` aqui.
        const components: any[] = [];
        
        // Exemplo para um template que usa o nome do lead:
        // const components = [{
        //   "type": "body",
        //   "parameters": [
        //     { "type": "text", "text": lead.name || "cliente" }
        //   ]
        // }];

        await sendWhatsAppTemplateMessage(
          lead.phone,
          campaign.template_name || "hello_world", // Usa o template da campanha ou um padrão
          components
        );
      });

      // Passo 3: Atualizar o status do lead para 'CONTACTED'
      await step.run(`3-update-lead-status-${lead.id}`, async () => {
        const sentTimestamp = new Date().toISOString();
        await supabase
          .from("leads")
          .update({ 
            status: 'CONTACTED', 
            last_outgoing_message_at: sentTimestamp,
            updated_at: sentTimestamp 
          })
          .eq("id", lead.id);
      });

      // Adiciona uma pequena pausa para não sobrecarregar a API do WhatsApp
      await step.sleep(`wait-after-lead-${lead.id}`, "1s");
    }

    // Passo 4: Marcar a campanha como concluída após processar todos os leads
    await step.run("4-mark-campaign-as-completed", async () => {
      await supabase
        .from("campaigns")
        .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
        .eq("id", campaignId);
    });

    console.log(`Campaign ${campaignId} processed successfully. ${leads.length} messages sent.`);
    return { status: "Success", leads_processed: leads.length };
  }
);