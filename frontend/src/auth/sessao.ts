import { normalizarToken, tokenValido } from './token.ts';

export type Sessao =
  | { papel: 'cliente'; token: string }
  | { papel: 'atendente'; nome?: string; email?: string }
  | null;

export interface ArmazenamentoSessao {
  ler(chave: string): string | null;
  gravar(chave: string, valor: string): void;
  apagar(chave: string): void;
}

export const CHAVE_SESSAO = 'estacionamento.sessao';

export function serializarSessao(sessao: Sessao): string | null {
  if (sessao === null) return null;
  if (sessao.papel === 'atendente') {
    return JSON.stringify({
      papel: 'atendente',
      ...(sessao.nome ? { nome: sessao.nome } : {}),
      ...(sessao.email ? { email: sessao.email } : {}),
    });
  }
  return JSON.stringify({ papel: 'cliente', token: sessao.token });
}

export function mesmaSessao(atual: Sessao, proxima: Sessao): boolean {
  return serializarSessao(atual) === serializarSessao(proxima);
}

export function lerSessao(armazenamento: ArmazenamentoSessao): Sessao {
  const bruto = armazenamento.ler(CHAVE_SESSAO);
  if (!bruto) return null;

  try {
    const valor: unknown = JSON.parse(bruto);
    if (!valor || typeof valor !== 'object') return null;
    const registro = valor as { papel?: unknown; token?: unknown; nome?: unknown; email?: unknown };
    if (registro.papel === 'atendente') {
      const nome = typeof registro.nome === 'string' && registro.nome.trim() !== '' ? registro.nome.trim() : undefined;
      const email = typeof registro.email === 'string' && registro.email.trim() !== '' ? registro.email.trim() : undefined;
      return { papel: 'atendente', ...(nome ? { nome } : {}), ...(email ? { email } : {}) };
    }
    if (registro.papel === 'cliente' && typeof registro.token === 'string' && tokenValido(registro.token)) {
      return { papel: 'cliente', token: normalizarToken(registro.token) };
    }
    return null;
  } catch {
    return null;
  }
}

export function gravarSessao(armazenamento: ArmazenamentoSessao, sessao: Sessao): void {
  const serializada = serializarSessao(sessao);
  if (serializada === null) {
    armazenamento.apagar(CHAVE_SESSAO);
    return;
  }
  armazenamento.gravar(CHAVE_SESSAO, serializada);
}

export function armazenamentoDaSessao(): ArmazenamentoSessao {
  return {
    ler: (chave) => sessionStorage.getItem(chave),
    gravar: (chave, valor) => sessionStorage.setItem(chave, valor),
    apagar: (chave) => sessionStorage.removeItem(chave),
  };
}
