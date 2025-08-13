// Caminho: inngest/functions/meetingReminders.ts

import { inngest } from "../client";
import { createClient } from "@/lib/supabase/server";

// Função para monitorar e criar lembretes de reunião
export const scanMeetingReminders = inngest.createFunction(
  { id: "scan-meeting-reminders", name: "Scan and Create Meeting Reminders" },
  { cron: "*/10 * * * *" }, // A cada 10 minutos
  async ({ step }) => {
    const supabase = createClient();

    try {
      // Busca reuniões que precisam de lembrete usando a função SQL otimizada
      const { data: meetingsNeedingReminder, error } = await step.run("fetch-meetings-needing-reminder", async () => {
        return await supabase.rpc('get_meetings_needing_reminder');
      });

      if (error) {
        console.error("[Meeting Reminders] Erro ao buscar reuniões:", error);
        return { status: "Error fetching meetings", error: error.message };
      }

      if (!meetingsNeedingReminder || meetingsNeedingReminder.length === 0) {
        return { status: "No meetings need reminders", count: 0 };
      }

      console.log(`[Meeting Reminders] Encontradas ${meetingsNeedingReminder.length} reuniões para lembrete.`);

      // Processa cada reunião
      for (const meeting of meetingsNeedingReminder) {
        await step.run(`process-meeting-reminder-${meeting.lead_id}`, async () => {
          try {
            let notificationMessage = "";
            let notificationType = meeting.reminder_type;

            if (meeting.reminder_type === 'reuniao_hoje') {
              notificationMessage = `📅 Reunião hoje com ${meeting.lead_name} às ${new Date(meeting.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
              
              // Marca que o lembrete diário foi enviado
              await supabase.from("leads").update({
                daily_reminder_sent: true
              }).eq("id", meeting.lead_id);

            } else if (meeting.reminder_type === 'lembrete_1h') {
              notificationMessage = `⏰ LEMBRETE: Reunião com ${meeting.lead_name} em 1 hora! (${new Date(meeting.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`;
              
              // Marca que o lembrete de 1h foi enviado
              await supabase.from("leads").update({
                meeting_reminder_sent: true
              }).eq("id", meeting.lead_id);
            }

            // Cria notificação para o usuário (SDR)
            await supabase.from("notifications").insert({
              user_id: meeting.client_id,
              message: notificationMessage,
              type: notificationType,
              related_lead_id: meeting.lead_id,
              is_read: false
            });

            // Se há um consultor associado, cria notificação para ele também
            if (meeting.consultant_id) {
              await supabase.from("notifications").insert({
                user_id: meeting.consultant_id,
                message: notificationMessage,
                type: notificationType,
                related_lead_id: meeting.lead_id,
                is_read: false
              });
            }

            console.log(`[Meeting Reminders] Criado lembrete ${meeting.reminder_type} para reunião ${meeting.lead_id}`);
            return { status: "Reminder created successfully" };

          } catch (error: any) {
            console.error(`[Meeting Reminders] Erro ao processar reunião ${meeting.lead_id}:`, error);
            return { status: "Error processing meeting", error: error.message };
          }
        });
      }

      return { status: "Meeting reminders scan completed", processedMeetings: meetingsNeedingReminder.length };
    } catch (error: any) {
      console.error("[Meeting Reminders] Erro geral:", error);
      return { status: "Failed", error: error.message };
    }
  }
);

// Função para resetar flags de lembrete diariamente (roda às 00:01)
export const resetDailyReminderFlags = inngest.createFunction(
  { id: "reset-daily-reminder-flags", name: "Reset Daily Reminder Flags" },
  { cron: "1 0 * * *" }, // Todos os dias às 00:01
  async ({ step }) => {
    const supabase = createClient();

    try {
      await step.run("reset-flags", async () => {
        return await supabase.rpc('reset_daily_reminder_flags');
      });

      console.log("[Meeting Reminders] Flags de lembrete diário resetadas.");
      return { status: "Daily reminder flags reset successfully" };
    } catch (error: any) {
      console.error("[Meeting Reminders] Erro ao resetar flags:", error);
      return { status: "Failed to reset flags", error: error.message };
    }
  }
);

