// Caminho: inngest/functions/whatsapp.ts

import { inngest } from "../client";
import { createClient } from "@/lib/supabase/server";
import { getWhatsAppMediaUrl } from "@/lib/whatsapp";
import { transcribeAudio } from "@/lib/media/transcription";
import { describeImage } from "@/lib/media/vision";
import { sendSequentialWhatsAppMessages } from "@/lib/whatsapp/messageSender";
import { getAIResponseWithTools } from "@/lib/ai/tool-based-conversation";
import { findAvailableSlotsAndProposeTimes } from "@/lib/calendar/scheduling";
// O tipo centralizado é importado, como deve ser.
import { type AIResponse } from "@/lib/types";

/**
 * Função Inngest principal, com a correção de tipagem definitiva.
 */
export const handleWhatsAppMessage = inngest.createFunction(
  { id: "handle-whatsapp-message", name: "Handle WhatsApp Message and Trigger AI" },
  { event: "whatsapp/message-received" },
  async ({ event, step }) => {
    const { leadId, message } = event.data;
    const supabase = createClient();

    try {
      // ETAPA 1: Buscar dados do lead
      const leadData = await step.run("fetch-lead-data", async () => {
        const { data, error } = await supabase.from("leads").select("id, client_id, phone, ai_status").eq("id", leadId).single();
        if (error) throw new Error(`Lead ${leadId} não encontrado.`);
        return data;
      });

      if (leadData.ai_status === "paused") {
        return { status: "AI paused", leadId };
      }

      // ETAPA 2: Processar a mensagem recebida
      let incomingMessageContent = "";
      switch (message.type) {
        case "text": incomingMessageContent = message.text.body; break;
        case "audio":
          const audioUrl = await getWhatsAppMediaUrl(message.audio.id);
          incomingMessageContent = await transcribeAudio(audioUrl, message.audio.mime_type);
          break;
        case "image":
          const imageUrl = await getWhatsAppMediaUrl(message.image.id);
          incomingMessageContent = await describeImage(imageUrl);
          break;
        default: return { status: "Unsupported message type" };
      }

      // ETAPA 3: Salvar mensagem recebida
      await step.run("save-incoming-message", async () => {
        return await supabase.from("messages").insert({ lead_id: leadId, client_id: leadData.client_id, direction: "inbound", role: "user", content: incomingMessageContent });
      });

      // ETAPA 4: Buscar histórico da conversa
      const conversationHistory = await step.run("fetch-conversation-history", async () => {
        const { data: messages, error } = await supabase.from("messages").select("role, content").eq("lead_id", leadId).order("created_at", { ascending: true }).limit(20);
        if (error) throw new Error(`Não foi possível buscar o histórico do lead ${leadId}.`);
        return messages.map((m: any) => ({ role: m.role, content: m.content || "" }));
      });
      
      // ETAPA 5: Chamar a IA para obter INTENÇÃO
      // ==================================================================
      // CORREÇÃO DEFINITIVA APLICADA AQUI
      // ==================================================================
      // Removemos o genérico <AIResponse> e usamos a asserção de tipo "as AIResponse" no final.
      const aiResponse = await step.run("get-ai-intent", () => 
        getAIResponseWithTools(conversationHistory, leadData.client_id)
      ) as AIResponse;

      // ETAPA 6: Agir com base na resposta da IA
      if (aiResponse.type === 'text') {
        await step.run("handle-text-response", async () => {
            if (!leadData.phone) throw new Error("Lead sem número de telefone.");
            const sentMessageTimestamp = new Date().toISOString();
            
            await sendSequentialWhatsAppMessages(leadData.phone, aiResponse.content, 1000);
            
            const fullResponse = aiResponse.content.join(" ");
            await supabase.from("messages").insert({ lead_id: leadId, client_id: leadData.client_id, direction: "outbound", role: "assistant", content: fullResponse });
            
            await supabase.from("leads").update({ last_outgoing_message_at: sentMessageTimestamp }).eq("id", leadId);
        });

        await step.sendEvent("schedule-nudge-after-text", {
            name: "nudge/schedule",
            data: { leadId, clientId: leadData.client_id, step: 1, lastOutgoingMessageAt: new Date().toISOString() },
        });

      } else if (aiResponse.type === 'tool_call') {
        const toolName = aiResponse.toolCall.function.name;

        switch (toolName) {
          case 'propor_agendamento_reuniao':
            await step.run("handle-propose-schedule-tool", async () => {
                const { message: proposalMessage, consultantId } = await findAvailableSlotsAndProposeTimes(leadId);
                
                if (consultantId && leadData.phone) {
                    await sendSequentialWhatsAppMessages(leadData.phone, [proposalMessage], 1000);
                    await supabase.from("leads").update({ status: 'QUALIFIED', consultant_id: consultantId }).eq("id", leadId);
                    await supabase.from("messages").insert({ lead_id: leadId, client_id: leadData.client_id, direction: "outbound", role: "assistant", content: proposalMessage });
                } else if (leadData.phone) {
                    await sendSequentialWhatsAppMessages(leadData.phone, [proposalMessage], 1000);
                }
            });
            break;
          
          default:
            console.warn(`[handleWhatsAppMessage] Ferramenta desconhecida chamada pela IA: ${toolName}`);
        }
      }

      return { status: "Processed successfully", intent: aiResponse.type };
    } catch (error: any) {
      console.error(`[handleWhatsAppMessage] Falha no processamento para o lead ${leadId}:`, error);
      return { status: "Failed", error: error.message };
    }
  }
);