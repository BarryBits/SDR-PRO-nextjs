import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * API Route para lidar com o callback de autenticação do Supabase.
 * * Esta rota é acionada depois que o usuário se autentica com sucesso
 * através de um provedor (como email/senha, Google, etc.) e o Supabase
 * o redireciona de volta para a aplicação com um código de autorização.
 * * O objetivo desta função é trocar esse código por uma sessão de usuário válida (cookie).
 * * @param request O objeto de requisição da Next.js.
 * @returns Uma resposta de redirecionamento para o dashboard em caso de sucesso,
 * ou de volta para a página de login em caso de erro.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  // 1. Verifica se o código de autorização está presente na URL.
  if (code) {
    const cookieStore = cookies();
    // **CORREÇÃO APLICADA AQUI**
    // A função `createClient` precisa ser chamada com `()` para ser executada
    // e retornar a instância do cliente Supabase.
    const supabase = createClient(); 

    // 2. Troca o código recebido por uma sessão de usuário.
    // O Supabase irá validar o código e, se for válido, criará um cookie de sessão seguro.
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    // 3. Trata possíveis erros na troca do código.
    if (error) {
      console.error("Erro ao trocar código por sessão do Supabase:", error.message);
      // Em caso de erro, redireciona o usuário de volta para a página de login
      // com uma mensagem de erro na URL para feedback.
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=Falha na autenticação. Por favor, tente novamente.`);
    }
  }

  // 4. Redireciona para o dashboard após o processo de login ser concluído com sucesso.
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
