import { sendWhatsAppMessage } from "@/lib/whatsapp";

/**
 * Envia múltiplas mensagens sequencialmente com um pequeno atraso entre elas.
 * Simula um comportamento de digitação mais humano.
 * @param to Número de telefone do destinatário.
 * @param messages Array de strings, onde cada string é uma mensagem a ser enviada.
 * @param delayMs Atraso em milissegundos entre cada mensagem (padrão: 1000ms).
 */
export async function sendSequentialWhatsAppMessages(to: string, messages: string[], delayMs: number = 1000) {
  for (const message of messages) {
    await sendWhatsAppMessage(to, message);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}


