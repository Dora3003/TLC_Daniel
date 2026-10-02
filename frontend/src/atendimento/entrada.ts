export const MENSAGEM_LOTACAO = 'Não há vagas disponíveis para registrar uma nova entrada.';

export function patioLotado(disponiveis: number | null | undefined): boolean {
  return disponiveis === 0;
}

export interface ConfirmacaoEntrada {
  id: string;
  placa: string;
  entradaEm: string;
}

export function confirmacaoDaEntrada(resposta: {
  id?: unknown;
  placa?: unknown;
  entradaEm?: unknown;
  token?: unknown;
}): ConfirmacaoEntrada | null {
  const id = texto(resposta.id);
  const placa = texto(resposta.placa);
  const entradaEm = texto(resposta.entradaEm);
  if (!id || !placa || !entradaEm) return null;
  return { id, placa, entradaEm };
}

function texto(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const limpo = valor.trim();
  return limpo === '' ? null : limpo;
}
