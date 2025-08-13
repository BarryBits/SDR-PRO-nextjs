import { redirect } from "next/navigation";

export default async function AuthCallbackPage({ searchParams }: { searchParams: { code?: string } }) {
  const code = searchParams.code;

  if (code) {
    // Redireciona para a API Route que fará a troca do código pela sessão
    redirect(`/api/auth/callback?code=${code}`);
  }

  // Se não houver código, redireciona para o login
  redirect("/auth/login");
}


