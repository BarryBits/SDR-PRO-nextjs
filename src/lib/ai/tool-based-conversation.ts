// Caminho: src/lib/ai/tool-based-conversation.ts

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Definição das "Ferramentas" que a IA pode usar, em formato JSON Schema.
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "propor_agendamento_reuniao",
      description: "Use esta ferramenta quando o lead expressar um interesse claro em agendar uma reunião.",
      parameters: { type: "object", properties: {} },
    },
  },
  // Adicione outras ferramentas aqui no futuro (confirmar_agendamento, registrar_informacao, etc.)
];

// Função que busca o prompt correto (customizado ou padrão)
async function getSystemPromptForClient(clientId: string): Promise<string> {
    // Esta lógica é uma cópia da que está na nossa API, garantindo consistência.
    // Em um projeto maior, isso poderia ser centralizado.
    const supabase = createClient();
    const { data } = await supabase.from('client_settings').select('ai_system_prompt').eq('client_id', clientId).single();
    if (data?.ai_system_prompt) return data.ai_system_prompt;
    
    // Fallback para o system.md
    try {
        const { promises: fs } = await import('fs');
        const path = await import('path');
        const filePath = path.join(process.cwd(), 'src', 'lib', 'ai', 'system.md');
        return await fs.readFile(filePath, 'utf-8');
    } catch {
        return "Você é um assistente de vendas prestativo."; // Fallback de segurança
    }
}

/**
 * Orquestra a chamada para a OpenAI, enviando o histórico da conversa e as ferramentas disponíveis.
 * @returns Uma resposta estruturada indicando se é um texto ou uma chamada de ferramenta.
 */
export async function getAIResponseWithTools(conversationHistory: any[], clientId: string) {
  const systemPrompt = await getSystemPromptForClient(clientId);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages,
    tools: tools,
    tool_choice: "auto",
  });

  const responseMessage = response.choices[0].message;
  const toolCalls = responseMessage.tool_calls;

  if (toolCalls) {
    // A IA decidiu usar uma ferramenta.
    return {
      type: "tool_call",
      toolCall: toolCalls[0], // Por enquanto, processamos apenas a primeira chamada de ferramenta.
    };
  } else {
    // A IA respondeu com uma mensagem de texto normal.
    const content = responseMessage.content || "";
    // Segmenta a resposta para uma experiência mais natural no WhatsApp
    const segmentedResponses = content.split(/\s*(?<=[.?!])\s+/).filter(s => s.trim() !== "");
    return {
      type: "text",
      content: segmentedResponses.length > 0 ? segmentedResponses : [content],
    };
  }
}