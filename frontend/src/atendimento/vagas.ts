export interface IndicadoresVagas {
  capacidade: number | null;
  ocupadas: number | null;
  disponiveis: number | null;
}

export function indicadoresOficiais(ocupacao: {
  capacidade?: unknown;
  ocupadas?: unknown;
  disponiveis?: unknown;
}): IndicadoresVagas {
  return {
    capacidade: numeroOficial(ocupacao.capacidade),
    ocupadas: numeroOficial(ocupacao.ocupadas),
    disponiveis: numeroOficial(ocupacao.disponiveis),
  };
}

export function textoIndicador(valor: number | null): string {
  return valor === null ? '—' : String(valor);
}

function numeroOficial(valor: unknown): number | null {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return null;
  return valor;
}
