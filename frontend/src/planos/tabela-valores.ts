import type { Plano } from '../api/tipos.ts';

/** Tabela de referência da tarifa oficial (AD-004): R$ 5,00/h, mínimo 1 hora. */
export function catalogoTarifaOficial(): Plano[] {
  const regras = 'R$ 5,00 por hora. Mínimo de 1 hora.';
  return [
    {
      id: '1h',
      nome: '1 hora',
      tipo: '1h',
      preco: 5,
      moeda: 'BRL',
      validade: 'Até 1 hora',
      disponivel: true,
      regras,
    },
    {
      id: '2h',
      nome: '2 horas',
      tipo: '1h',
      preco: 10,
      moeda: 'BRL',
      validade: 'Até 2 horas',
      disponivel: true,
      regras,
    },
    {
      id: '3h',
      nome: '3 horas',
      tipo: '1h',
      preco: 15,
      moeda: 'BRL',
      validade: 'Até 3 horas',
      disponivel: true,
      regras,
    },
    {
      id: '4h',
      nome: '4 horas',
      tipo: '1h',
      preco: 20,
      moeda: 'BRL',
      validade: 'Até 4 horas',
      disponivel: true,
      regras,
    },
    {
      id: '5h',
      nome: '5 horas',
      tipo: '5h',
      preco: 25,
      moeda: 'BRL',
      validade: 'Até 5 horas',
      disponivel: true,
      regras,
    },
  ];
}

export function planoPorId(id: string): Plano | null {
  return catalogoTarifaOficial().find((plano) => plano.id === id) ?? null;
}
