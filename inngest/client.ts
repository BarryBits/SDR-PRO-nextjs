// Caminho: src/inngest/client.ts

import { EventSchemas, Inngest } from "inngest";
import { type ActionableInsight } from "@/actions/dashboardActions";

// ... (Comentários e outros eventos permanecem os mesmos) ...
type Events = {
  // ========================================================================
  // EVENTOS DE CONVERSA E FOLLOW-UP
  // ========================================================================
  "whatsapp/message-received": {
    data: {
      from: string;
      leadId: string;
      message: any;
    };
  };
  "nudge/schedule": {
    data: {
      leadId: string;
      clientId: string;
      step: number;
      lastOutgoingMessageAt: string;
    };
  };
  "daily-follow-up/check": {
    data: {
      timestamp: string;
      description?: string;
    };
  };

  // ========================================================================
  // EVENTOS DE CAMPANHA E AGENDAMENTO
  // ========================================================================
  "campaign/sendMessage": {
    data: {
      leadId: string;
      message: string;
    };
  };
  "meeting/reminder": {
    data: {
      eventId: string;
      leadId: string;
    };
  };
  "campaign/process": {
    data: {
      campaignId: string;
    };
  };

  // ========================================================================
  // EVENTOS DA CENTRAL DE AÇÕES DO DASHBOARD
  // ========================================================================

  /**
   * Disparado pela Central de Ações para iniciar uma campanha de follow-up.
   * CORRIGIDO: O campo 'templateSuggestion' foi renomeado para 'templateName'
   * para refletir que o nome do template vem do input do usuário, e não de uma sugestão.
   */
  "follow-up/start": {
    data: {
      leadIds: string[];
      templateName: string; // <-- CORREÇÃO APLICADA AQUI
      clientId: string;
    };
  };

  "reactivation/start": {
    data: {
      insight: ActionableInsight;
      clientId: string;
    };
  };
};

export const inngest = new Inngest({ id: "sdr-pro-nextjs", schemas: new EventSchemas().fromRecord<Events>() });
