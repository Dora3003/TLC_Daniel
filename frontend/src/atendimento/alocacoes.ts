export interface LinhaAlocacao {
  id: string | null;
  placa: string | null;
  entradaEm: string | null;
}

export function linhasAlocacao(
  veiculos: readonly { id?: unknown; placa?: unknown; entradaEm?: unknown; token?: unknown }[],
): LinhaAlocacao[] {
  return veiculos.map((veiculo) => ({
    id: texto(veiculo.id),
    placa: texto(veiculo.placa),
    entradaEm: texto(veiculo.entradaEm),
  }));
}

function texto(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const limpo = valor.trim();
  return limpo === '' ? null : limpo;
}
