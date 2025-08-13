import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

// Este buffer em memória é adequado para desenvolvimento, mas possui limitações em produção.
// Para um ambiente de produção escalável, uma solução mais persistente como Redis ou o próprio Supabase seria melhor.
const messageBuffer = new Map<string, { messages: any[], timer: NodeJS.Timeout }>();

/**
 * O endpoint principal do webhook que recebe mensagens da API da Meta WhatsApp.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log("Webhook do WhatsApp recebido:", JSON.stringify(payload, null, 2));

    const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // Se não houver um objeto de mensagem válido, acatamos a requisição e saímos.
    if (!message) {
      return NextResponse.json({ status: "No message found" }, { status: 200 });
    }

    const from = message.from; // O ID do remetente (número do lead).
    
    // Neste sistema, estamos usando o número de telefone como identificador único do lead.
    // Um sistema mais robusto poderia primeiro consultar o banco para encontrar um leadId com base no número 'from'.
    const leadId = from;

    // --- Lógica de Buffer de Mensagens ---
    const buffer = messageBuffer.get(leadId);
    if (buffer) {
      // Se já existe um buffer para este lead, adiciona a nova mensagem e reinicia o timer.
      buffer.messages.push(message);
      clearTimeout(buffer.timer);
      buffer.timer = setTimeout(() => {
        processBufferedMessages(leadId, from); // Passa 'from' para a função de processamento.
      }, 25000); // Atraso de 25 segundos.
    } else {
      // Se não existe um buffer, cria um novo.
      const timer = setTimeout(() => {
        processBufferedMessages(leadId, from); // Passa 'from' para a função de processamento.
      }, 25000);
      
      messageBuffer.set(leadId, {
        messages: [message],
        timer: timer
      });
    }

    // Acatamos o webhook imediatamente com um status de sucesso.
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("Erro ao processar webhook do WhatsApp:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Processa as mensagens do buffer para um lead e as envia para o Inngest.
 * @param leadId O ID único do lead.
 * @param from O número de telefone do lead.
 */
async function processBufferedMessages(leadId: string, from: string) {
  const buffer = messageBuffer.get(leadId);
  if (!buffer) return;

  try {
    // Processa cada mensagem que foi coletada no buffer.
    for (const message of buffer.messages) {
      // Isso envia o evento para o Inngest para processamento assíncrono.
      await inngest.send({
        name: "whatsapp/message-received",
        data: {
          from: from, // <-- **Correção aplicada**
          leadId: leadId,
          message: message
        }
      });
    }
  } catch (error) {
    console.error(`Erro ao processar mensagens do buffer para lead ${leadId}:`, error);
  } finally {
    // Limpa o buffer após o processamento.
    messageBuffer.delete(leadId);
  }
}

/**
 * O endpoint GET exigido pela Meta para verificação do webhook.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "your_verify_token";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificado com sucesso!");
    return new NextResponse(challenge, { status: 200 });
  } else {
    // Se a verificação falhar, retorna um erro 403 Forbidden.
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}