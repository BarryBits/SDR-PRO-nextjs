"use server";

/**
 * @file src/actions/settingsActions.ts
 * @description Server Actions para o gerenciamento de configurações do cliente.
 *
 * @version 2.0.0 (Refatorado para Segurança e Validação Real de APIs)
 * @author Gemini Dev Lead & [Seu Nome]
 *
 * @features
 * - Adicionada função `getAuthenticatedClient` para garantir segurança multi-tenant.
 * - Implementada validação real para as credenciais da API do WhatsApp.
 * - Implementada validação real para a chave da API da OpenAI.
 * - Removidas funções redundantes e simplificada a interface de `Settings`.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";
import axios from 'axios';

// Interface de Settings simplificada para refletir a nova estrutura da UI.
export interface Settings {
  id?: string;
  client_id?: string;
  openai_api_key?: string;
  ai_model?: string;
  default_system_prompt_id?: string;
  whatsapp_api_token?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_business_account_id?: string;
  whatsapp_connection_status?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Função auxiliar interna para obter o cliente Supabase, o usuário autenticado
 * e o ID da empresa (client_id) associado a esse usuário.
 */
async function getAuthenticatedClient() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data: clientUser, error: clientUserError } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('user_id', user.id)
    .single();

  if (clientUserError || !clientUser) {
    throw new Error("Não foi possível encontrar a empresa associada a este usuário.");
  }

  return { supabase, user, clientId: clientUser.client_id };
}

/**
 * Busca as configurações do cliente logado.
 */
export async function getSettings(): Promise<{ data: Settings | null; error: string | null }> {
  try {
    const { supabase, clientId } = await getAuthenticatedClient();

    const { data, error } = await supabase
      .from('client_settings')
      .select('*')
      .eq('client_id', clientId) // CORREÇÃO: Usa o clientId correto
      .single();

    if (error && error.code !== 'PGRST116') { // Ignora erro "nenhuma linha encontrada"
      throw error;
    }

    // Se não existir configuração, retorna um objeto padrão limpo.
    if (!data) {
      const defaultSettings: Settings = {
        client_id: clientId,
        ai_model: 'gpt-4o-mini',
        whatsapp_connection_status: 'not_configured',
      };
      return { data: defaultSettings, error: null };
    }

    return { data: data as Settings, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar configurações.";
    console.error("ERRO em getSettings:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

/**
 * Atualiza ou cria as configurações do cliente logado (operação de "upsert").
 */
export async function updateSettings(settings: Partial<Settings>): Promise<{ data: Settings | null; error: string | null }> {
  try {
    const { supabase, clientId } = await getAuthenticatedClient();

    const settingsToUpsert = {
      ...settings,
      client_id: clientId, // Garante que o client_id é sempre o correto
      updated_at: new Date().toISOString(),
    };
    
    // Remove campos que não devem ser enviados no upsert
    delete settingsToUpsert.id;
    delete settingsToUpsert.created_at;

    const { data, error } = await supabase
      .from('client_settings')
      .upsert(settingsToUpsert, { onConflict: 'client_id' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    revalidatePath("/settings");
    return { data: data as Settings, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar configurações.";
    console.error("ERRO em updateSettings:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

/**
 * VALIDAÇÃO REAL: Verifica se as credenciais do WhatsApp são válidas fazendo uma chamada à API da Meta.
 */
export async function validateWhatsAppCredentials(
  apiUrl: string, 
  apiToken: string, 
  phoneNumberId: string
): Promise<{ valid: boolean; error: string | null }> {
  if (!apiToken || !phoneNumberId) {
    return { valid: false, error: "Token e ID do Número são obrigatórios." };
  }

  try {
    // Faz uma chamada de verdade para a API da Meta para validar as credenciais.
    await axios.get(`${apiUrl}/${phoneNumberId}`, {
      headers: { 'Authorization': `Bearer ${apiToken}` },
    });
    return { valid: true, error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message || "Credenciais inválidas ou API inacessível.";
    console.error("ERRO em validateWhatsAppCredentials:", errorMessage);
    return { valid: false, error: errorMessage };
  }
}

/**
 * VALIDAÇÃO REAL: Verifica se a chave da API OpenAI é válida.
 */
export async function testOpenAIConnection(apiKey: string): Promise<{ valid: boolean; error: string | null }> {
  if (!apiKey) {
    return { valid: false, error: "Chave da API OpenAI é obrigatória." };
  }

  try {
    const openai = new OpenAI({ apiKey });
    // Faz uma chamada leve e barata para listar os modelos, apenas para validar a chave.
    await openai.models.list();
    return { valid: true, error: null };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message || "Chave da API inválida ou inacessível.";
    console.error("ERRO em testOpenAIConnection:", errorMessage);
    return { valid: false, error: errorMessage };
  }
}