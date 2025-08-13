import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Transcreve um arquivo de áudio para texto usando a API Whisper da OpenAI.
 * @param audioUrl URL do arquivo de áudio.
 * @param mimeType Tipo MIME do arquivo de áudio (ex: "audio/ogg").
 * @returns O texto transcrito.
 */
export async function transcribeAudio(audioUrl: string, mimeType: string): Promise<string> {
  try {
    // Baixar o arquivo de áudio
    const response = await axios.get(audioUrl, { responseType: "arraybuffer" });
    const audioBuffer = Buffer.from(response.data);

    // Criar um Blob ou File a partir do buffer para a API da OpenAI
    // A API do OpenAI espera um objeto File ou Blob para o parâmetro file.
    // No ambiente Node.js, podemos simular isso ou usar uma biblioteca como 'form-data'.
    // Para simplicidade e compatibilidade com o SDK do OpenAI, vamos usar um Buffer e um nome de arquivo.
    
    // O SDK do OpenAI para Node.js pode aceitar um Buffer diretamente para o 'file' se o 'name' for fornecido.
    const audioFile = new File([audioBuffer], `audio.${mimeType.split('/')[1]}`, { type: mimeType });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "pt", // Definir o idioma para português
    });

    return transcription.text;
  } catch (error: any) {
    console.error("Erro ao transcrever áudio:", error.response?.data || error.message);
    throw new Error(`Falha ao transcrever áudio: ${error.response?.data?.error?.message || error.message}`);
  }
}


