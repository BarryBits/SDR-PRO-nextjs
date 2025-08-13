"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation"; // 👈 Importado
import { type AppUser } from "@/context/auth-provider";

/**
 * Realiza o login do usuário com email e senha.
 * Ação agora controla o redirecionamento para garantir um fluxo atômico.
 */
export async function signIn(formData: FormData) { // 👈 Assinatura simplificada
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  // Validação básica para garantir que os campos não estão vazios
  if (!email || !password) {
    return redirect("/auth/login?error=Email%20e%20senha%20são%20obrigatórios.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Em caso de erro do Supabase, redireciona de volta para a página de login
    // com a mensagem de erro na URL para ser exibida ao usuário.
    return redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  // Se o login for bem-sucedido, revalida o cache e redireciona para o dashboard.
  // Esta é a parte crucial que resolve a condição de corrida.
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Realiza o logout do usuário.
 * (Esta função já estava correta e foi mantida)
 */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  return redirect("/auth/login");
}

/**
 * Busca o usuário autenticado e enriquece os dados com informações do cliente e permissão.
 * (Esta função já estava correta e foi mantida)
 */
export async function getUser(): Promise<AppUser | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: clientUser, error: clientUserError } = await supabase
    .from('client_users')
    .select(`
      role,
      clients (
        id,
        name
      )
    `)
    .eq('user_id', user.id)
    .single();

  if (clientUserError) {
    console.error("Erro ao buscar dados do cliente para o usuário:", clientUserError.message);
    return null;
  }
  
  const clientData = Array.isArray(clientUser.clients) 
    ? clientUser.clients[0] 
    : clientUser.clients;
    
  const appUser: AppUser = {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.full_name || user.email,
    avatar_url: user.user_metadata?.avatar_url,
    client: clientData ? { id: clientData.id, name: clientData.name } : null,
    role: clientUser.role,
  };

  return appUser;
}