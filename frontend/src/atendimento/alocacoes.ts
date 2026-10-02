export interface LinhaAlocacao {
  id: string | null;
  placa: string | null;
  motoristaNome: string | null;
  entradaEm: string | null;
}

export function linhasAlocacao(
  veiculos: readonly {
    id?: unknown;
    placa?: unknown;
    entradaEm?: unknown;
    token?: unknown;
    motoristaNome?: unknown;
  }[],
): LinhaAlocacao[] {
  return veiculos.map((veiculo) => ({
    id: texto(veiculo.token),
    placa: texto(veiculo.placa),
    motoristaNome: texto(veiculo.motoristaNome),
    entradaEm: texto(veiculo.entradaEm),
  }));
}

export function filtrarAlocacoes(
  linhas: readonly LinhaAlocacao[],
  termo: string,
): LinhaAlocacao[] {
  const busca = termo.trim().toLowerCase();
  if (busca === '') return [...linhas];
  return linhas.filter((linha) => {
    const nome = (linha.motoristaNome ?? '').toLowerCase();
    const token = (linha.id ?? '').toLowerCase();
    const placa = (linha.placa ?? '').toLowerCase();
    return nome.includes(busca) || token.includes(busca) || placa.includes(busca);
  });
}

function texto(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const limpo = valor.trim();
  return limpo === '' ? null : limpo;
}
