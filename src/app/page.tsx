import { redirect } from 'next/navigation';

/**
 * Esta é a página raiz da aplicação.
 * Seu único propósito é redirecionar qualquer visitante que chegue aqui
 * para a tela de login. O middleware.ts cuidará de redirecionar
 * usuários já logados para o dashboard.
 */
export default function RootPage() {
  redirect('/auth/login');

  // Não é necessário retornar nenhum JSX, pois o redirecionamento
  // interrompe a renderização deste componente.
  return null;
}