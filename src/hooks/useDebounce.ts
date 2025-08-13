// sdr_pro_VERSAO_FINAL/frontend/src/hooks/useDebounce.ts

import { useState, useEffect } from 'react';

/**
 * Hook customizado para "atrasar" a atualização de um valor.
 * É muito útil para campos de busca, evitando uma chamada à API a cada tecla digitada.
 * @param value O valor a ser "atrasado" (ex: o texto da busca).
 * @param delay O tempo de atraso em milissegundos (ex: 500ms).
 * @returns O valor "atrasado".
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configura um timer para atualizar o valor debounced depois do delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpa o timer se o valor mudar (ex: usuário continua digitando).
    // Isso garante que o valor só seja atualizado quando o usuário parar de digitar.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Roda o efeito apenas se o valor ou o delay mudarem

  return debouncedValue;
}