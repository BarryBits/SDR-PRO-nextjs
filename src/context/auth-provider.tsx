"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

/**
 * Interface que define a estrutura do objeto de usuário na aplicação.
 */
export interface AppUser {
  id: string;
  name?: string;
  email: string;
  avatar_url?: string;
  client: { id: string; name: string } | null;
  role: string | null;
}

/**
 * Interface que define os valores expostos pelo Contexto de Autenticação.
 */
interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/**
 * Criação do Contexto de Autenticação com valores padrão.
 * Este contexto será responsável por gerenciar e compartilhar o estado de autenticação
 * em toda a aplicação.
 */
const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

/**
 * Componente Provedor (Provider) que encapsula a lógica de autenticação.
 * Qualquer componente filho dentro deste provedor terá acesso ao estado de autenticação.
 * @param {object} props - As propriedades do componente.
 * @param {ReactNode} props.children - Os componentes filhos que serão renderizados.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * Função assíncrona para buscar e validar a sessão do usuário no backend.
   * Ela é chamada quando a aplicação carrega pela primeira vez.
   */
  const fetchUser = async () => {
    // Inicia o estado de carregamento para exibir loaders na UI, se necessário.
    setLoading(true);
    try {
      // Realiza a chamada para a API que verifica a sessão do usuário.
      const response = await fetch("/api/auth/user");

      if (response.ok) {
        // Se a resposta for bem-sucedida (status 200),
        // atualiza o estado com os dados do usuário.
        const userData = await response.json();
        setUser(userData as AppUser);
      } else {
        // Se a resposta indicar um erro (ex: 401 Unauthorized),
        // garante que o estado do usuário seja nulo (deslogado).
        setUser(null);
      }
    } catch (error) {
      // Em caso de erro de rede (ex: sem conexão),
      // também define o usuário como nulo e exibe um erro no console.
      console.error("Erro de rede ao buscar usuário:", error);
      setUser(null);
    } finally {
      // Garante que o estado de carregamento seja desativado
      // independentemente do resultado (sucesso ou falha).
      setLoading(false);
    }
  };

  /**
   * Efeito que executa a função `fetchUser` uma única vez,
   * quando o AuthProvider é montado na tela.
   */
  useEffect(() => {
    fetchUser();
  }, []); // O array de dependências vazio `[]` garante que isso rode apenas uma vez.

  /**
   * Função para realizar o logout do usuário.
   */
  const logout = async () => {
    try {
      // Chama a API de logout para invalidar a sessão no servidor.
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        // Se o logout for bem-sucedido, limpa o estado do usuário localmente
        // e redireciona para a página de login.
        setUser(null);
        router.push("/auth/login");
      } else {
        console.error("Ocorreu um erro ao tentar fazer logout no servidor.");
      }
    } catch (error) {
      console.error("Erro de rede ao fazer logout:", error);
    }
  };

  /**
   * Função para forçar a recarga dos dados do usuário.
   * Útil após a atualização do perfil do usuário, por exemplo.
   */
  const refreshUser = async () => {
    await fetchUser();
  };

  // O Provedor disponibiliza o estado (user, loading) e as ações (logout, refreshUser)
  // para todos os componentes filhos que consumirem este contexto.
  return (
    <AuthContext.Provider
      value={{ user, loading, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook customizado para consumir o Contexto de Autenticação.
 * Simplifica o uso do contexto nos componentes e inclui uma verificação
 * para garantir que ele seja usado dentro de um AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
};