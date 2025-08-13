// Caminho: src/middleware.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Middleware principal do Next.js.
 *
 * Este middleware intercepta as requisições para as rotas definidas no `config.matcher`
 * e atua como o principal ponto de controle de acesso e gerenciamento de sessão da aplicação.
 */
export async function middleware(request: NextRequest) {
  
  // 1. Cria uma resposta inicial que será usada para enviar os cookies de volta ao navegador.
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Cria um cliente Supabase que pode operar no ambiente de servidor do middleware.
  // Ele é configurado para ler e escrever cookies na requisição e na resposta.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Função para obter todos os cookies da requisição que chega do navegador.
        getAll() {
          return request.cookies.getAll();
        },
        // Função para definir os cookies necessários tanto na resposta QUANTO na requisição.
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // Define os cookies na requisição para que fiquem disponíveis para Server Components.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value)); // <-- CORREÇÃO APLICADA AQUI
          // Define os cookies na resposta para enviá-los de volta ao navegador.
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // 3. Acessa a sessão do usuário. Isso também atualiza o token de sessão se necessário.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const isProtectedPage = !isAuthPage && !isApiRoute; // Assumindo que tudo fora de /auth e /api é protegido

  // 4. LÓGICA DE REDIRECIONAMENTO:
  
  // CASO 1: O usuário JÁ ESTÁ LOGADO, mas está tentando acessar uma página de autenticação.
  if (user && isAuthPage) {
    // Redireciona para o dashboard, pois não precisa fazer login novamente.
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // CASO 2: O usuário NÃO ESTÁ LOGADO, mas está tentando acessar uma página protegida.
  if (!user && isProtectedPage) {
    // Redireciona para a página de login.
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // CASO 3: O usuário NÃO ESTÁ LOGADO e está tentando acessar uma rota de API protegida.
  if (!user && isApiRoute) {
    // Retorna um erro 401 JSON para requisições de API.
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // 5. Se nenhuma das condições de redirecionamento for atendida, permite que a requisição continue.
  return response;
}

// Configuração do matcher para definir em quais rotas o middleware deve ser executado.
export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas, exceto aquelas que são tipicamente para arquivos estáticos
     * ou rotas de API que não devem passar por verificação de autenticação (como webhooks).
     */
    '/((?!api/webhooks/whatsapp|_next/static|_next/image|favicon.ico).*)',
  ],
};