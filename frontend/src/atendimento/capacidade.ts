/** Capacidade total do pátio usada no painel (a API não informa lotação). */
export const CAPACIDADE_PATIO = 20;

export function calcularDisponiveis(ocupadas: number, capacidade = CAPACIDADE_PATIO): number {
  return Math.max(0, capacidade - ocupadas);
}
