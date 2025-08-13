"use server";

/**
 * @file src/actions/consultantActions.ts
 * @description Server Actions para o gerenciamento completo de Consultores.
 *
 * @version 3.0.0 (Refatorado para Segurança e Robustez Multi-Tenant)
 * @author Gemini Dev Lead & [Seu Nome]
 *
 * @refactor
 * - Adicionada função auxiliar `getAuthenticatedClient` para centralizar a obtenção do `clientId`.
 * - Corrigido o uso de `user.id` em todas as funções, substituindo pelo `clientId` correto.
 * - Aumentada a segurança garantindo que todas as operações (CRUD) respeitem as políticas de RLS.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  type Consultant, 
  type ConsultantCreate, 
  type ConsultantUpdate,
  ConsultantCreateSchema,
  ConsultantUpdateSchema
} from "@/lib/types";

/**
 * Função auxiliar interna para obter o cliente Supabase, o usuário autenticado
 * e, mais importante, o ID do cliente (empresa/tenant) associado a esse usuário.
 * Centraliza a lógica de segurança e evita repetição de código.
 */
async function getAuthenticatedClient() {
  const supabase = createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Usuário não autenticado.");
  }

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
 * Busca todos os consultores do cliente logado.
 */
export async function getConsultants(): Promise<{ data: Consultant[] | null; error: string | null }> {
  try {
    const { supabase, clientId } = await getAuthenticatedClient();

    const { data, error } = await supabase
      .from('consultants')
      .select('*')
      .eq('client_id', clientId) // CORREÇÃO: Usa o clientId correto.
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { data: data as Consultant[], error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar consultores.";
    console.error("ERRO em getConsultants:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

/**
 * Cria um novo consultor para o cliente logado.
 */
export async function createConsultant(consultantData: ConsultantCreate): Promise<{ data: Consultant | null; error: string | null }> {
  try {
    const { supabase, clientId } = await getAuthenticatedClient();

    const validatedData = ConsultantCreateSchema.safeParse(consultantData);
    if (!validatedData.success) {
      const errorMessages = validatedData.error.issues.map((issue) => issue.message).join(", ");
      throw new Error(`Erro de validação: ${errorMessages}`);
    }

    const { data, error } = await supabase
      .from('consultants')
      .insert({ 
        ...validatedData.data, 
        client_id: clientId // CORREÇÃO: Usa o clientId correto, garantindo que a policy RLS seja satisfeita.
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    revalidatePath("/consultants");
    return { data: data as Consultant, error: null };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao criar consultor.";
    console.error("ERRO em createConsultant:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

/**
 * Atualiza um consultor existente, garantindo que ele pertença ao cliente logado.
 */
export async function updateConsultant(id: string, consultantData: ConsultantUpdate): Promise<{ data: Consultant | null; error: string | null }> {
  try {
    const { supabase, clientId } = await getAuthenticatedClient();

    const validatedData = ConsultantUpdateSchema.safeParse(consultantData);
    if (!validatedData.success) {
      const errorMessages = validatedData.error.issues.map((issue) => issue.message).join(", ");
      throw new Error(`Erro de validação: ${errorMessages}`);
    }

    const { data, error } = await supabase
      .from('consultants')
      .update({ 
        ...validatedData.data, 
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('client_id', clientId) // CORREÇÃO: Garante que o usuário só possa editar consultores da sua própria empresa.
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    revalidatePath("/consultants");
    return { data: data as Consultant, error: null };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar consultor.";
    console.error("ERRO em updateConsultant:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

/**
 * Busca um consultor específico pelo ID, garantindo que ele pertença ao cliente logado.
 */
export async function getConsultantById(id: string): Promise<{ data: Consultant | null; error: string | null }> {
  try {
    const { supabase, clientId } = await getAuthenticatedClient();

    const { data, error } = await supabase
      .from('consultants')
      .select('*')
      .eq('id', id)
      .eq('client_id', clientId) // CORREÇÃO: Garante que o usuário só possa ver consultores da sua própria empresa.
      .single();

    if (error) {
      throw error;
    }

    return { data: data as Consultant, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar consultor.";
    console.error("ERRO em getConsultantById:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

/**
 * Deleta um consultor, garantindo que ele pertença ao cliente logado.
 */
export async function deleteConsultant(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { supabase, clientId } = await getAuthenticatedClient();

    const { error } = await supabase
      .from('consultants')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId); // CORREÇÃO: Garante que o usuário só possa deletar consultores da sua própria empresa.

    if (error) {
      throw error;
    }

    revalidatePath("/consultants");
    return { success: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao deletar consultor.";
    console.error("ERRO em deleteConsultant:", { message: errorMessage, errorObject: error });
    return { success: false, error: errorMessage };
  }
}