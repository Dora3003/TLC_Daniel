import type { ArmazenamentoSessao } from '../auth/sessao.ts';

function chave(token: string): string {
  return `estacionamento.plano.${token}`;
}

export function lerPlanoId(armazenamento: ArmazenamentoSessao, token: string): string | null {
  const valor = armazenamento.ler(chave(token));
  if (!valor || valor.trim() === '') return null;
  return valor;
}

export function gravarPlanoId(armazenamento: ArmazenamentoSessao, token: string, planoId: string): void {
  armazenamento.gravar(chave(token), planoId);
}

export function apagarPlanoId(armazenamento: ArmazenamentoSessao, token: string): void {
  armazenamento.apagar(chave(token));
}
