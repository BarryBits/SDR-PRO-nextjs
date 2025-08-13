import { createBrowserClient } from '@supabase/ssr'

/**
 * Cria um cliente Supabase para ser usado no lado do cliente (navegador).
 *
 * Este cliente é ideal para componentes React com a diretiva "use client",
 * permitindo interações com o Supabase diretamente do navegador de forma segura.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
