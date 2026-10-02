export interface ConfirmacaoSaida {
  id: string;
  placa: string;
  saidaEm: string;
  status: string;
}

export function confirmacaoDaSaida(resposta: {
  id?: unknown;
  placa?: unknown;
  saidaEm?: unknown;
  status?: unknown;
}): ConfirmacaoSaida | null {
  const id = texto(resposta.id);
  const placa = texto(resposta.placa);
  const saidaEm = texto(resposta.saidaEm);
  const status = texto(resposta.status);
  if (!id || !placa || !saidaEm || !status) return null;
  return { id, placa, saidaEm, status };
}

function texto(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const limpo = valor.trim();
  return limpo === '' ? null : limpo;
}
