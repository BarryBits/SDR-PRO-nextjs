"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  SystemPromptSchema, 
  SystemPromptCreateSchema, 
  SystemPromptUpdateSchema,
  type SystemPrompt, 
  type SystemPromptCreate, 
  type SystemPromptUpdate 
} from "@/lib/types";

/**
 * Busca todos os prompts de sistema do cliente logado
 */
export async function getSystemPrompts(): Promise<{ data: SystemPrompt[] | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const { data, error } = await supabase
      .from('system_prompts')
      .select('*')
      .eq('client_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { data: data as SystemPrompt[], error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar prompts de sistema.";
    console.error("ERRO em getSystemPrompts:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

/**
 * Cria um novo prompt de sistema
 */
export async function createSystemPrompt(promptData: SystemPromptCreate): Promise<{ data: SystemPrompt | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    // Validação dos dados de entrada
    const validatedData = SystemPromptCreateSchema.safeParse(promptData);
    if (!validatedData.success) {
      const errorMessages = validatedData.error.issues
        .map((issue) => issue.message)
        .join(", ");
      throw new Error(`Erro de validação: ${errorMessages}`);
    }

    // Se está marcando como padrão, remove o padrão dos outros
    if (validatedData.data.is_default) {
      await supabase
        .from('system_prompts')
        .update({ is_default: false })
        .eq('client_id', user.id);
    }

    const { data, error } = await supabase
      .from('system_prompts')
      .insert({ 
        ...validatedData.data, 
        client_id: user.id 
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    revalidatePath("/(protected)/(shell)/settings");
    revalidatePath("/(protected)/(shell)/campaigns");
    return { data: data as SystemPrompt, error: null };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao criar prompt de sistema.";
    console.error("ERRO em createSystemPrompt:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

/**
 * Atualiza um prompt de sistema existente
 */
export async function updateSystemPrompt(id: string, promptData: SystemPromptUpdate): Promise<{ data: SystemPrompt | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    // Validação dos dados de entrada
    const validatedData = SystemPromptUpdateSchema.safeParse(promptData);
    if (!validatedData.success) {
      const errorMessages = validatedData.error.issues
        .map((issue) => issue.message)
        .join(", ");
      throw new Error(`Erro de validação: ${errorMessages}`);
    }

    // Se está marcando como padrão, remove o padrão dos outros
    if (validatedData.data.is_default) {
      await supabase
        .from('system_prompts')
        .update({ is_default: false })
        .eq('client_id', user.id)
        .neq('id', id);
    }

    const { data, error } = await supabase
      .from('system_prompts')
      .update({ 
        ...validatedData.data, 
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('client_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    revalidatePath("/(protected)/(shell)/settings");
    revalidatePath("/(protected)/(shell)/campaigns");
    return { data: data as SystemPrompt, error: null };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar prompt de sistema.";
    console.error("ERRO em updateSystemPrompt:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

/**
 * Busca um prompt de sistema específico pelo ID
 */
export async function getSystemPromptById(id: string): Promise<{ data: SystemPrompt | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const { data, error } = await supabase
      .from('system_prompts')
      .select('*')
      .eq('id', id)
      .eq('client_id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return { data: data as SystemPrompt, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar prompt de sistema.";
    console.error("ERRO em getSystemPromptById:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

/**
 * Deleta um prompt de sistema
 */
export async function deleteSystemPrompt(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    // Verifica se é o prompt padrão
    const { data: prompt } = await supabase
      .from('system_prompts')
      .select('is_default')
      .eq('id', id)
      .eq('client_id', user.id)
      .single();

    if (prompt?.is_default) {
      throw new Error("Não é possível excluir o prompt padrão.");
    }

    const { error } = await supabase
      .from('system_prompts')
      .delete()
      .eq('id', id)
      .eq('client_id', user.id);

    if (error) {
      throw error;
    }

    revalidatePath("/(protected)/(shell)/settings");
    revalidatePath("/(protected)/(shell)/campaigns");
    return { success: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao deletar prompt de sistema.";
    console.error("ERRO em deleteSystemPrompt:", { message: errorMessage, errorObject: error });
    return { success: false, error: errorMessage };
  }
}

/**
 * Busca o prompt padrão do cliente
 */
export async function getDefaultSystemPrompt(): Promise<{ data: SystemPrompt | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const { data, error } = await supabase
      .from('system_prompts')
      .select('*')
      .eq('client_id', user.id)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return { data: data as SystemPrompt || null, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar prompt padrão.";
    console.error("ERRO em getDefaultSystemPrompt:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}


/**
 * Define um prompt como padrão
 */
export async function setDefaultSystemPrompt(promptId: string): Promise<{ data: SystemPrompt | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    // Remove o padrão de todos os prompts do cliente
    const { error: resetError } = await supabase
      .from('system_prompts')
      .update({ is_default: false })
      .eq('client_id', user.id);

    if (resetError) {
      throw resetError;
    }

    // Define o prompt selecionado como padrão
    const { data, error } = await supabase
      .from('system_prompts')
      .update({ is_default: true })
      .eq('id', promptId)
      .eq('client_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    revalidatePath("/(protected)/(shell)/settings");
    return { data: data as SystemPrompt, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao definir prompt padrão.";
    console.error("ERRO em setDefaultSystemPrompt:", { message: errorMessage, errorObject: error });
    return { data: null, error: errorMessage };
  }
}

