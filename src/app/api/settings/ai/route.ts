// Caminho: src/app/api/settings/ai/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Função auxiliar para ler o prompt padrão do sistema a partir do arquivo system.md.
 * Isso garante que sempre haja um prompt base caso o usuário não tenha configurado um.
 * @returns {Promise<string>} O conteúdo do arquivo system.md ou um prompt de fallback em caso de erro.
 */
async function getDefaultPrompt(): Promise<string> {
  // Constrói o caminho para o arquivo de forma segura, independentemente de onde o servidor está rodando.
  const filePath = path.join(process.cwd(), 'src', 'lib', 'ai', 'system.md');
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error("ERRO CRÍTICO: Não foi possível ler o arquivo de prompt padrão em src/lib/ai/system.md.", error);
    // Retorna um prompt de segurança mínimo caso o arquivo não seja encontrado.
    return "Você é um assistente de vendas prestativo. Seu objetivo é ajudar o cliente e agendar uma reunião.";
  }
}

/**
 * Busca a configuração de prompt da IA para o usuário logado.
 * 1. Tenta buscar um prompt customizado salvo na tabela 'client_settings'.
 * 2. Se não encontrar, carrega e retorna o prompt padrão do arquivo 'system.md'.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('client_settings')
    .select('ai_system_prompt')
    .eq('client_id', user.id)
    .single();
    
  // Se o usuário tiver um prompt customizado e não vazio, retorne-o.
  if (data?.ai_system_prompt) {
    return NextResponse.json({ system_prompt: data.ai_system_prompt });
  } 
  
  // Se não houver prompt customizado ou a busca falhar (de forma esperada para um novo usuário),
  // carregue e retorne o prompt padrão.
  const defaultPrompt = await getDefaultPrompt();
  return NextResponse.json({ system_prompt: defaultPrompt });
}

/**
 * Recebe e salva o prompt customizado do sistema para o usuário logado
 * na tabela 'client_settings'.
 */
export async function PUT(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }
    
    const { system_prompt } = await request.json();

    if (typeof system_prompt !== 'string') {
        return NextResponse.json({ error: "O prompt deve ser um texto." }, { status: 400 });
    }

    // Usa 'upsert' para criar ou atualizar a configuração do cliente.
    const { error } = await supabase
        .from('client_settings')
        .upsert({ 
            client_id: user.id, 
            ai_system_prompt: system_prompt, 
            updated_at: new Date().toISOString() 
        }, { 
            onConflict: 'client_id' 
        });

    if (error) {
        console.error("Erro ao salvar o prompt da IA no Supabase:", error);
        return NextResponse.json({ error: "Erro interno ao salvar o prompt." }, { status: 500 });
    }

    return NextResponse.json({ message: "Prompt da IA salvo com sucesso!" });
}