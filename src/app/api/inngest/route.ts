// Caminho: src/app/api/inngest/route.ts

import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";

// Importações das funções existentes
import { processCampaign } from "@/inngest/functions/campaigns";
import { scanAndSendNudges, morningReactivation, handleFollowUpNudge } from "@/inngest/functions/nudges";
import { scanMeetingReminders, resetDailyReminderFlags } from "@/inngest/functions/meetingReminders";
import { handleWhatsAppMessage } from "@/inngest/functions/whatsapp";
// CORREÇÃO: Importa a nova e única função do arquivo dailyFollowUp.ts
import { scheduleInitialContactCheck } from "@/inngest/functions/dailyFollowUp"; 
import { handleFollowUpStart, handleReactivationStart } from "@/inngest/functions/dashboardAutomations";

// A função 'handleMeetingReminder' do arquivo 'reminders.ts' foi removida, pois o arquivo foi excluído.

const handler = serve({
  client: inngest,
  functions: [
    // Funções de Conversa e Nudges
    handleWhatsAppMessage,
    scanAndSendNudges,
    morningReactivation,
    handleFollowUpNudge, // Mantido por compatibilidade legada, conforme projeto

    // Funções de Lembretes e Campanhas
    scanMeetingReminders,
    resetDailyReminderFlags,
    processCampaign,
    
    // CORREÇÃO: Remove as chamadas antigas e adiciona a nova função de agendamento diário
    scheduleInitialContactCheck,

    // Funções da Automação do Dashboard
    handleFollowUpStart,
    handleReactivationStart,
  ],
});

export const GET = handler.GET;
export const POST = handler.POST;
export const PUT = handler.PUT;
