import { Suspense } from 'react';
import LoginForm from './login-form';
import { Loader2 } from 'lucide-react';

// Este componente é um Server Component. Ele pode ser pré-renderizado.
export default function LoginPage() {
  return (
    // Suspense mostra um fallback (um loader) enquanto espera o componente dinâmico carregar no cliente.
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}