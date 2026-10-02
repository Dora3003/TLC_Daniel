import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ContextoNavegacao, useNavegacao } from './contexto-navegacao.ts';

function lerUrl(): { pathname: string; search: string } {
  return { pathname: window.location.pathname, search: window.location.search };
}

export function ProvedorNavegacao({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState(lerUrl);

  useEffect(() => {
    const aoVoltar = () => setUrl(lerUrl());
    window.addEventListener('popstate', aoVoltar);
    return () => window.removeEventListener('popstate', aoVoltar);
  }, []);

  const ir = useCallback((destino: string, modo: 'push' | 'replace') => {
    const atual = `${window.location.pathname}${window.location.search}`;
    if (atual === destino) return;
    if (modo === 'push') window.history.pushState({}, '', destino);
    else window.history.replaceState({}, '', destino);
    const alvo = new URL(destino, window.location.origin);
    setUrl({ pathname: alvo.pathname, search: alvo.search });
  }, []);

  const navegar = useCallback((destino: string) => ir(destino, 'push'), [ir]);
  const substituir = useCallback((destino: string) => ir(destino, 'replace'), [ir]);

  return (
    <ContextoNavegacao.Provider value={{ pathname: url.pathname, search: url.search, navegar, substituir }}>
      {children}
    </ContextoNavegacao.Provider>
  );
}

export function LinkInterno({ href, children }: { href: string; children: ReactNode }) {
  const { pathname, navegar } = useNavegacao();
  const atual = pathname === href;
  return (
    <a
      href={href}
      aria-current={atual ? 'page' : undefined}
      onClick={(evento) => {
        if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey || evento.button !== 0) return;
        evento.preventDefault();
        navegar(href);
      }}
    >
      {children}
    </a>
  );
}
