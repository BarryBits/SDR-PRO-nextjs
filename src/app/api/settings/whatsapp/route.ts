// Caminho: src/app/api/settings/whatsapp/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import axios from 'axios';

/**
 * Busca as configurações de WhatsApp do usuário logado na tabela 'client_settings'.
 * Por razões de segurança, o token de acesso nunca é retornado por completo para o frontend.
 * Ele retorna um token mascarado para exibição.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('client_settings')
    .select('whatsapp_phone_number_id, whatsapp_business_account_id, whatsapp_connection_status, whatsapp_access_token')
    .eq('client_id', user.id)
    .single();

  // Ignora o erro "PGRST116", que significa apenas que o usuário ainda não tem uma linha de configuração.
  // Isso é um comportamento esperado para novos usuários.
  if (error && error.code !== 'PGRST116') {
    console.error("Erro ao buscar configurações do WhatsApp no Supabase:", error);
    return NextResponse.json({ error: "Erro interno ao buscar configurações." }, { status: 500 });
  }

  // Se o usuário ainda não tem configurações, retorna um objeto padrão.
  if (!data) {
    return NextResponse.json({
        whatsapp_phone_number_id: "",
        whatsapp_business_account_id: "",
        whatsapp_connection_status: "not_configured",
        whatsapp_access_token: ""
    });
  }

  // Prepara os dados para enviar ao frontend, mascarando o token para segurança.
  const settingsForFrontend = {
    whatsapp_phone_number_id: data.whatsapp_phone_number_id,
    whatsapp_business_account_id: data.whatsapp_business_account_id,
    whatsapp_connection_status: data.whatsapp_connection_status,
    whatsapp_access_token: data.whatsapp_access_token ? `****${data.whatsapp_access_token.slice(-4)}` : ''
  };

  return NextResponse.json(settingsForFrontend);
}


/**
 * Recebe novas credenciais do WhatsApp do frontend.
 * Primeiro, valida essas credenciais fazendo uma chamada de teste para a API da Meta.
 * Se a validação for bem-sucedida, salva as informações de forma segura no banco de dados.
 */
export async function PUT(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
  }

  const { token, phoneId, businessId } = await request.json();

  if (!token || !phoneId || !businessId) {
    return NextResponse.json({ error: "Todos os campos (Token, ID do Telefone, ID da Conta) são obrigatórios." }, { status: 400 });
  }

  // Etapa 1: Validação em tempo real com a API da Meta.
  try {
    const metaApiUrl = `https://graph.facebook.com/v19.0/${phoneId}`;
    await axios.get(metaApiUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    // Se a chamada acima não gerar um erro, as credenciais são consideradas válidas.
  } catch (axiosError: any) {
    // Se a chamada falhar, capturamos o erro e retornamos uma mensagem clara.
    console.error("Falha na validação com a API da Meta:", axiosError.response?.data || axiosError.message);
    return NextResponse.json({ error: "Credenciais inválidas. Verifique o Token de Acesso e o ID do Número de Telefone e tente novamente." }, { status: 400 });
  }

  // Etapa 2: Se a validação passou, salvamos os dados no Supabase.
  const settingsData = {
    client_id: user.id,
    whatsapp_access_token: token, // IMPORTANTE: Para produção, use o Supabase Vault para criptografar este valor.
    whatsapp_phone_number_id: phoneId,
    whatsapp_business_account_id: businessId,
    whatsapp_connection_status: 'configured',
    updated_at: new Date().toISOString()
  };

  // Usamos 'upsert' para criar a linha de configuração se ela não existir,
  // ou para atualizá-la se já existir, evitando erros.
  const { error: upsertError } = await supabase
    .from('client_settings')
    .upsert(settingsData, { onConflict: 'client_id' });

  if (upsertError) {
    console.error("Erro ao salvar configurações no Supabase:", upsertError);
    return NextResponse.json({ error: "Erro interno ao salvar as configurações." }, { status: 500 });
  }

  return NextResponse.json({ message: "Configurações do WhatsApp salvas e validadas com sucesso!" });
}