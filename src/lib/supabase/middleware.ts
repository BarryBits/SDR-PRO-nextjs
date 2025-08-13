import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Lógica de middleware para gerenciar a sessão de autenticação do Supabase.
 *
 * Esta função é chamada a cada requisição para manter a sessão do usuário
 * atualizada, renovando o cookie de sessão se necessário.
 */
export async function updateSession(request: NextRequest) {
  // Cria uma resposta inicial que será modificada pelo cliente Supabase.
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // **CORREÇÃO APLICADA AQUI**
        // A nova API espera uma função `getAll` que retorna todos os cookies da requisição.
        getAll() {
          return request.cookies.getAll()
        },
        // **CORREÇÃO APLICADA AQUI**
        // A nova API espera uma função `setAll` para definir múltiplos cookies na resposta.
        // O Supabase usa isso para definir ou atualizar os cookies de sessão.
        setAll(cookiesToSet) {
          // Itera sobre todos os cookies que o Supabase precisa definir.
          cookiesToSet.forEach(({ name, value, options }) => {
            // Adiciona cada cookie à resposta que será enviada de volta ao navegador.
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // O ato de chamar `getUser()` força o Supabase a validar a sessão atual.
  // Se o token de sessão precisar ser atualizado, ele usará a função `setAll`
  // que definimos acima para enviar o novo cookie na resposta.
  await supabase.auth.getUser()

  return response
}
