// Caminho: src/lib/calendar/scheduling.ts

import { createClient } from "@/lib/supabase/server";

/**
 * ATENÇÃO: A implementação real desta função requer a integração com a API do Google Calendar.
 * O código abaixo é uma simulação ESTRUTURAL de como o algoritmo que projetamos funcionaria.
 * Você precisará substituir a parte de "buscar horários" pela chamada real à API do Google.
 */

// Simulação de uma chamada à API do Google Calendar
async function getBusySlotsFromGoogle(consultantId: string, startDate: Date, endDate: Date): Promise<{ start: Date, end: Date }[]> {
  console.log(`Buscando horários ocupados para o consultor ${consultantId} entre ${startDate.toISOString()} e ${endDate.toISOString()}`);
  // LÓGICA REAL AQUI:
  // 1. Buscar as credenciais do Google Calendar do consultor no banco de dados.
  // 2. Usar a biblioteca 'googleapis' para se autenticar.
  // 3. Chamar a API 'calendar.freebusy.query' para obter os horários ocupados.
  // 4. Retornar a lista de horários ocupados.
  
  // Retorno simulado para fins de demonstração:
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return [
    { start: new Date(new Date(tomorrow).setHours(14, 0, 0, 0)), end: new Date(new Date(tomorrow).setHours(15, 0, 0, 0)) },
    { start: new Date(new Date(tomorrow).setHours(16, 0, 0, 0)), end: new Date(new Date(tomorrow).setHours(17, 30, 0, 0)) }
  ];
}

/**
 * Algoritmo de busca e proposição de horários, implementando a lógica de "round-robin" e sugestões inteligentes.
 * @param leadId O ID do lead para o qual estamos buscando um horário.
 * @returns Um objeto contendo a mensagem para o lead e o ID do consultor selecionado.
 */
export async function findAvailableSlotsAndProposeTimes(leadId: string) {
  const supabase = createClient();

  // 1. Buscar consultores ativos com calendário conectado, ordenados por quem recebeu reunião por último.
  const { data: consultants, error: consultantError } = await supabase
    .from("consultants")
    .select("id, name, last_meeting_scheduled_at")
    // .eq('calendar_connected', true) // Descomente quando tiver essa coluna
    .eq('active', true)
    .order('last_meeting_scheduled_at', { ascending: true, nullsFirst: true });

  if (consultantError || !consultants || consultants.length === 0) {
    throw new Error("Nenhum consultor ativo e disponível encontrado.");
  }

  // 2. Iterar sobre os consultores (em ordem de prioridade) até encontrar horários.
  for (const consultant of consultants) {
    // Implementação do algoritmo de busca de horários (Fase 2 do nosso plano)
    // ... (Esta parte seria o algoritmo completo que discutimos)
    
    // Versão simplificada para este exemplo:
    const now = new Date();
    const startDate = new Date(now.setDate(now.getDate() + 1)); // Começa a busca a partir de amanhã
    const endDate = new Date(new Date().setDate(startDate.getDate() + 14)); // Janela de 14 dias

    const busySlots = await getBusySlotsFromGoogle(consultant.id, startDate, endDate);
    
    // Lógica simplificada para encontrar 2 slots. A versão completa teria as estratégias de fallback.
    const suggestedSlots = [
        "Terça-feira (12/08) às 10:00",
        "Quinta-feira (14/08) às 15:00"
    ];

    if (suggestedSlots.length > 0) {
      const message = `Ótimo! Para te ajudar, o consultor ${consultant.name} tem alguns horários. Qual destes fica melhor para você?\n\n- ${suggestedSlots.join("\n- ")}\n\n(Horário de Brasília)`;
      return { message, consultantId: consultant.id };
    }
  }

  // Se o loop terminar e nenhum horário for encontrado para nenhum consultor.
  const fallbackMessage = "Nossos especialistas estão com a agenda bem cheia nas próximas semanas! Mas não se preocupe, já notifiquei nossa equipe e entraremos em contato assim que surgir um encaixe. 👍";
  return { message: fallbackMessage, consultantId: null };
}