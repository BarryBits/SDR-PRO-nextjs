// Caminho: src/inngest/functions/dailyFollowUp.ts

import { inngest } from "../client";

/**
 * @fileoverview Este arquivo agora funciona como um gatilho diário agendado (cron job).
 * Sua única responsabilidade é disparar um evento para o sistema, sinalizando
 * que é hora de iniciar verificações diárias, como a busca por leads que não
 * responderam ao contato inicial. A lógica de negócio principal foi movida para
 * as Server Actions (`actions/dashboardActions.ts`) para ser executada sob demanda
 * quando o usuário acessa o dashboard, garantindo dados sempre atualizados.
 *
 * @version 2.0.0
 * @author Seu Nome & Gemini Dev Lead
 */

/**
 * Função Inngest que agenda a verificação diária de contatos iniciais.
 * Ela não executa a busca, apenas dispara o evento que pode ser usado
 * por outras partes do sistema ou para futuras automações.
 */
export const scheduleInitialContactCheck = inngest.createFunction(
  { 
    id: "schedule-initial-contact-check", 
    name: "Schedule Daily Check for Unanswered Leads" 
  },
  // Roda todo dia às 08:00 da manhã (horário do servidor, geralmente UTC).
  { cron: "0 8 * * *" },
  async ({ step }) => {
    
    /**
     * Dispara um evento genérico de verificação.
     * Atualmente, a principal lógica que reage a essa "necessidade diária" está
     * na função `getActionableInsights` no dashboard. Este evento de cron
     * serve como um "despertador" para o sistema e pode ser usado no futuro
     * para automações adicionais, como o envio de um relatório diário por e-mail.
     */
    await step.sendEvent("trigger-daily-check-event", {
      name: "daily-follow-up/check",
      data: { 
        timestamp: new Date().toISOString(),
        description: "Daily check for leads who have not responded to the initial template."
      }
    });

    const message = "[Inngest Cron] Gatilho para verificação diária de contatos iniciais foi disparado com sucesso.";
    console.log(message);

    // Retorna um status claro sobre a ação executada.
    return { 
      status: "Success",
      message: message
    };
  }
);

// A função 'handleDailyFollowUp' foi removida pois sua lógica foi
// transferida e aprimorada dentro de 'actions/dashboardActions.ts'.
// Isso centraliza a lógica de negócio e torna este arquivo um gatilho puro.
