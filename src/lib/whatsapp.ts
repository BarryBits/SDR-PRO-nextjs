import axios from 'axios';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0'; // Ou a versão mais recente
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

export async function sendWhatsAppMessage(to: string, message: string) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('Variáveis de ambiente WHATSAPP_ACCESS_TOKEN ou WHATSAPP_PHONE_NUMBER_ID não configuradas.');
  }

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Erro ao enviar mensagem do WhatsApp:', error.response?.data || error.message);
    throw new Error(`Falha ao enviar mensagem do WhatsApp: ${error.response?.data?.error?.message || error.message}`);
  }
}

export async function sendWhatsAppTemplateMessage(to: string, templateName: string, components: any[]) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('Variáveis de ambiente WHATSAPP_ACCESS_TOKEN ou WHATSAPP_PHONE_NUMBER_ID não configuradas.');
  }

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'pt_BR' },
          components: components,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Erro ao enviar mensagem de template do WhatsApp:', error.response?.data || error.message);
    throw new Error(`Falha ao enviar mensagem de template do WhatsApp: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Baixa um arquivo de mídia da API do WhatsApp.
 * @param mediaId O ID da mídia fornecido pelo webhook do WhatsApp.
 * @returns Um Buffer contendo os dados do arquivo de mídia.
 */
export async function downloadWhatsAppMedia(mediaId: string): Promise<Buffer> {
  if (!WHATSAPP_ACCESS_TOKEN) {
    throw new Error('Variável de ambiente WHATSAPP_ACCESS_TOKEN não configurada.');
  }

  try {
    const response = await axios.get(
      `${WHATSAPP_API_URL}/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },
        responseType: 'arraybuffer', // Importante para lidar com dados binários
      }
    );
    return Buffer.from(response.data);
  } catch (error: any) {
    console.error('Erro ao baixar mídia do WhatsApp:', error.response?.data || error.message);
    throw new Error(`Falha ao baixar mídia do WhatsApp: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Obtém a URL de download de um arquivo de mídia do WhatsApp.
 * @param mediaId O ID da mídia fornecido pelo webhook do WhatsApp.
 * @returns A URL de download da mídia.
 */
export async function getWhatsAppMediaUrl(mediaId: string): Promise<string> {
  if (!WHATSAPP_ACCESS_TOKEN) {
    throw new Error('Variável de ambiente WHATSAPP_ACCESS_TOKEN não configurada.');
  }

  try {
    const response = await axios.get(
      `${WHATSAPP_API_URL}/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },
      }
    );
    return response.data.url;
  } catch (error: any) {
    console.error('Erro ao obter URL da mídia do WhatsApp:', error.response?.data || error.message);
    throw new Error(`Falha ao obter URL da mídia do WhatsApp: ${error.response?.data?.error?.message || error.message}`);
  }
}

// Exemplo de como lidar com webhooks de mensagens recebidas
// Esta função seria chamada por uma API Route em src/app/api/webhooks/whatsapp/route.ts
export async function handleWhatsAppWebhook(payload: any) {
  console.log('Webhook do WhatsApp recebido:', JSON.stringify(payload, null, 2));

  // Processar o payload do webhook aqui
  // Ex: extrair mensagens, IDs de contato, etc.
  // Encaminhar para o Inngest para processamento assíncrono, se necessário

  // Exemplo básico de extração de mensagem de texto
  const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (message && message.type === 'text') {
    const from = message.from; // ID do remetente
    const text = message.text.body; // Conteúdo da mensagem
    console.log(`Mensagem recebida de ${from}: ${text}`);
    // Aqui você chamaria a lógica da IA para gerar uma resposta
    // e enviaria de volta usando sendWhatsAppMessage
  }

  return { status: 'success' };
}


