import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cria um cliente Supabase para ser usado em Componentes de Servidor,
 * Server Actions e API Routes no Next.js App Router.
 *
 * Esta implementação utiliza a API de cookies mais recente do `@supabase/ssr`,
 * eliminando os avisos de depreciação.
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // A nova API espera uma função `getAll` que retorna todos os cookies.
        getAll() {
          return cookieStore.getAll()
        },
        // A nova API espera uma função `setAll` para definir múltiplos cookies.
        // Isso é mais otimizado para cenários de server-side rendering.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // O método `set` pode falhar em certos contextos (ex: renderização estática).
            // O erro é ignorado nesses casos, pois a autenticação não é necessária.
          }
        },
      },
    }
  )
}
