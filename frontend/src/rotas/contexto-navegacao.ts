import { createContext, useContext } from 'react';

export interface Navegacao {
  pathname: string;
  search: string;
  navegar: (destino: string) => void;
  substituir: (destino: string) => void;
}

export const ContextoNavegacao = createContext<Navegacao | null>(null);

export function useNavegacao(): Navegacao {
  const navegacao = useContext(ContextoNavegacao);
  if (!navegacao) throw new Error('Navegação indisponível');
  return navegacao;
}
