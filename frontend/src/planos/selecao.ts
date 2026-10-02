import type { Plano } from '../api/tipos.ts';

export function podeAvancar(plano: Plano | null): boolean {
  return plano?.disponivel === true;
}

export type ResultadoRevisao = 'igual' | 'alterado' | 'indisponivel';

export function decidirRevisao(selecionado: Plano, atual: Plano): ResultadoRevisao {
  if (!atual.disponivel) return 'indisponivel';
  if (
    selecionado.nome !== atual.nome ||
    selecionado.preco !== atual.preco ||
    selecionado.validade !== atual.validade ||
    selecionado.regras !== atual.regras
  ) {
    return 'alterado';
  }
  return 'igual';
}

