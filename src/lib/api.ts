// src/lib/api.ts
import axios from "axios";

/**
 * Instância centralizada do Axios para todas as chamadas de API do lado do cliente.
 *
 * Benefícios de usar uma instância centralizada:
 * 1.  **Configuração Única**: Todas as configurações, como a URL base,
 * são definidas em um único lugar.
 * 2.  **Interceptors**: Facilita a adição de 'interceptors' para manipular
 * requisições (ex: adicionar um token de autenticação) ou respostas
 * (ex: tratar erros de forma global) em todas as chamadas.
 * 3.  **Consistência**: Garante que todos os hooks e componentes usem a mesma
 * configuração para se comunicar com o backend.
 */

// Define a URL base para todas as requisições.
// Como estamos usando API Routes do Next.js, a base é relativa ao próprio domínio.
const baseURL = "/api";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Exemplo de como adicionar um interceptor para incluir um token de autenticação
 * em todas as requisições. Você pode descomentar e adaptar esta lógica
 * quando implementar a autenticação do lado do cliente.
 */
/*
api.interceptors.request.use(
  (config) => {
    // Tenta obter o token (ex: de um cookie ou localStorage)
    const token = localStorage.getItem('auth_token');
    
    // Se o token existir, adiciona-o ao header 'Authorization'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Trata erros na configuração da requisição
    return Promise.reject(error);
  }
);
*/

