import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Descreve uma imagem usando a API GPT-4o Vision da OpenAI.
 * @param imageUrl URL da imagem.
 * @returns A descrição textual da imagem.
 */
export async function describeImage(imageUrl: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // GPT-4o suporta visão
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Descreva esta imagem em detalhes, focando em elementos relevantes para um contexto de conversa de vendas ou prospecção. Se houver texto na imagem, transcreva-o." },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 300,
    });

    return response.choices[0].message.content || "";
  } catch (error: any) {
    console.error("Erro ao descrever imagem:", error.response?.data || error.message);
    throw new Error(`Falha ao descrever imagem: ${error.response?.data?.error?.message || error.message}`);
  }
}


