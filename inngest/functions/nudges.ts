// Caminho: inngest/functions/nudges.ts

import { inngest } from "../client";
import { createClient } from "@/lib/supabase/server";
import { getAIResponseWithTools } from "@/lib/ai/tool-based-conversation";
import { sendSequentialWhatsAppMessages } from "@/lib/whatsapp/messageSender";
import type { OpenAI } from "openai";

// CONTRATO DE DADOS
type AITextResponse = { type: 'text'; content: string[] };
type AIToolCallResponse = { type: 'tool_call'; toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall };
type AIResponse = AITextResponse | AIToolCallResponse;

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

// Nova lógica de cadência conforme especificado:
// 10min, 10min, 20min, 20min, 30min, 30min, depois 1h em 1h
const NUDGE_INTERVALS_MINUTES = [10, 10, 20, 20, 30, 30]; // Após isso, 60 minutos
const END_OF_DAY_HOUR = 20;
const START_OF_DAY_HOUR = 8;
const MORNING_REACTIVATION_HOUR = 7;
const MORNING_REACTIVATION_MINUTE = 50;

// Função principal de scanner de nudges (roda a cada 5 minutos)
export const scanAndSendNudges = inngest.createFunction(
  { id: "scan-and-send-nudges", name: "Scan and Send Nudges" },
  { cron: "*/5 * * * *" }, // A cada 5 minutos
  async ({ step }) => {
    const supabase = createClient();

    try {
      // Busca leads que precisam de nudge usando a função SQL otimizada
      const { data: leadsNeedingNudge, error } = await step.run("fetch-leads-needing-nudge", async () => {
        return await supabase.rpc("get_leads_needing_nudge");
      });

      if (error) {
        console.error("[Nudge Scanner] Erro ao buscar leads:", error);
        return { status: "Error fetching leads", error: error.message };
      }

      if (!leadsNeedingNudge || leadsNeedingNudge.length === 0) {
        return { status: "No leads need nudging", count: 0 };
      }

      console.log(`[Nudge Scanner] Encontrados ${leadsNeedingNudge.length} leads para nudge.`);

      // Processa cada lead
      for (const leadData of leadsNeedingNudge) {
        await step.run(`process-nudge-lead-${leadData.lead_id}`, async () => {
          try {
            // Busca o histórico da conversa
            const { data: messages, error: msgError } = await supabase
              .from("messages")
              .select("role, content")
              .eq("lead_id", leadData.lead_id)
              .order("created_at", { ascending: true })
              .limit(20);

            if (msgError) {
              console.error(`[Nudge] Erro ao buscar histórico do lead ${leadData.lead_id}:`, msgError);
              return { status: "Error fetching messages" };
            }

            const conversationHistory: ConversationMessage[] = messages.map((m: any) => ({
              role: m.role,
              content: m.content || ''
            }));

            // Adiciona instrução específica para o nudge
            const nudgeInstruction = `[Instrução para Kalel: O lead não respondeu há ${Math.round(leadData.minutes_since_last_message)} minutos. Este é o nudge ${leadData.nudge_step + 1}. Continue a conversa com uma mensagem curta e natural para reengajá-lo. Não tente agendar reunião, apenas reative a conversa.]`;
            conversationHistory.push({ role: "assistant", content: nudgeInstruction });

            // Gera resposta da IA
            const aiResponse = await getAIResponseWithTools(conversationHistory, leadData.client_id);

            let aiResponseSegments: string[];
            if (aiResponse.type === 'text') {
              aiResponseSegments = aiResponse.content || [];
            } else {
              console.warn(`[Nudge] IA tentou usar ferramenta. Usando fallback.`);
              aiResponseSegments = ["Só para garantir que recebeu minha última mensagem. 😊"];
            }

            // Envia mensagem
            if (leadData.phone) {
              await sendSequentialWhatsAppMessages(leadData.phone, aiResponseSegments, 1000);
              
              const sentTimestamp = new Date().toISOString();
              
              // Salva mensagem no banco
              await supabase.from("messages").insert({
                lead_id: leadData.lead_id,
                client_id: leadData.client_id,
                direction: "outbound",
                role: "assistant",
                content: aiResponseSegments.join(" ")
              });

              // Atualiza lead com novo timestamp e incrementa nudge step
              await supabase.from("leads").update({
                last_outgoing_message_at: sentTimestamp,
                nudge_sequence_step: leadData.nudge_step + 1
              }).eq("id", leadData.lead_id);

              console.log(`[Nudge] Enviado nudge ${leadData.nudge_step + 1} para lead ${leadData.lead_id}`);
            }

            return { status: "Nudge sent successfully" };
          } catch (error: any) {
            console.error(`[Nudge] Erro ao processar lead ${leadData.lead_id}:`, error);
            return { status: "Error processing lead", error: error.message };
          }
        });
      }

      return { status: "Nudge scan completed", processedLeads: leadsNeedingNudge.length };
    } catch (error: any) {
      console.error("[Nudge Scanner] Erro geral:", error);
      return { status: "Failed", error: error.message };
    }
  }
);

// Função do "despertador" matinal (roda todos os dias às 07:50)
export const morningReactivation = inngest.createFunction(
  { id: "morning-reactivation", name: "Morning Lead Reactivation" },
  { cron: "50 7 * * *" }, // Todos os dias às 07:50
  async ({ step }) => {
    const supabase = createClient();

    try {
      // Busca leads que ficaram silenciados após as 20h do dia anterior
      const { data: leadsToReactivate, error } = await step.run("fetch-leads-to-reactivate", async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(20, 0, 0, 0); // 20:00 de ontem

        return await supabase
          .from("leads")
          .select("id, client_id, phone, name")
          .eq("ai_status", "active")
          .not("last_outgoing_message_at", "is", null)
          .gte("last_outgoing_message_at", yesterday.toISOString())
          .or("last_incoming_message_at.is.null,last_incoming_message_at.lt.last_outgoing_message_at");
      });

      if (error) {
        console.error("[Morning Reactivation] Erro ao buscar leads:", error);
        return { status: "Error fetching leads", error: error.message };
      }

      if (!leadsToReactivate || leadsToReactivate.length === 0) {
        return { status: "No leads to reactivate", count: 0 };
      }

      console.log(`[Morning Reactivation] Reativando ${leadsToReactivate.length} leads.`);

      // Processa cada lead
      for (const lead of leadsToReactivate) {
        await step.run(`reactivate-lead-${lead.id}`, async () => {
          try {
            // Busca histórico da conversa
            const { data: messages, error: msgError } = await supabase
              .from("messages")
              .select("role, content")
              .eq("lead_id", lead.id)
              .order("created_at", { ascending: true })
              .limit(20);

            if (msgError) {
              console.error(`[Morning Reactivation] Erro ao buscar histórico do lead ${lead.id}:`, msgError);
              return { status: "Error fetching messages" };
            }

            const conversationHistory: ConversationMessage[] = messages.map((m: any) => ({
              role: m.role,
              content: m.content || ''
            }));

            // Instrução para reativação matinal
            const reactivationInstruction = `[Instrução para Kalel: É um novo dia! Reative a conversa com ${lead.name} de forma natural e amigável. Use uma mensagem de bom dia que retome o assunto da conversa anterior. Aproveite a janela de 24h do WhatsApp.]`;
            conversationHistory.push({ role: "assistant", content: reactivationInstruction });

            // Gera resposta da IA
            const aiResponse = await getAIResponseWithTools(conversationHistory, lead.client_id);

            let aiResponseSegments: string[];
            if (aiResponse.type === 'text') {
              aiResponseSegments = aiResponse.content || [];
            } else {
              console.warn(`[Morning Reactivation] IA tentou usar ferramenta. Usando fallback.`);
              aiResponseSegments = [`Bom dia, ${lead.name}! Espero que esteja bem. Só retomando nossa conversa de ontem... 😊`];
            }

            // Envia mensagem
            if (lead.phone) {
              await sendSequentialWhatsAppMessages(lead.phone, aiResponseSegments, 1000);
              
              const sentTimestamp = new Date().toISOString();
              
              // Salva mensagem no banco
              await supabase.from("messages").insert({
                lead_id: lead.id,
                client_id: lead.client_id,
                direction: "outbound",
                role: "assistant",
                content: aiResponseSegments.join(" ")
              });

              // Atualiza lead e reseta nudge sequence
              await supabase.from("leads").update({
                last_outgoing_message_at: sentTimestamp,
                nudge_sequence_step: 0 // Reseta para começar nova cadência
              }).eq("id", lead.id);

              console.log(`[Morning Reactivation] Reativado lead ${lead.id}`);
            }

            return { status: "Lead reactivated successfully" };
          } catch (error: any) {
            console.error(`[Morning Reactivation] Erro ao processar lead ${lead.id}:`, error);
            return { status: "Error processing lead", error: error.message };
          }
        });
      }

      return { status: "Morning reactivation completed", reactivatedLeads: leadsToReactivate.length };
    } catch (error: any) {
      console.error("[Morning Reactivation] Erro geral:", error);
      return { status: "Failed", error: error.message };
    }
  }
);

// Manter a função original para compatibilidade (será removida gradualmente)
export const handleFollowUpNudge = inngest.createFunction(
  { id: "handle-follow-up-nudge", name: "Handle Intelligent Follow-up Nudge (Legacy)" },
  { event: "nudge/schedule" },
  async ({ event, step }) => {
    console.log("[Legacy Nudge] Esta função está sendo descontinuada. Use o novo sistema de scanner.");
    return { status: "Legacy function - use new scanner system" };
  }
);