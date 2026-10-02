import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Ticket } from '../api/tipos.ts';
import { contratacoesConfirmadas } from './contratacoes.ts';

function ticket(status: Ticket['status'], validade: string | null = null): Ticket {
  return {
    placa: 'ABC1234',
    motoristaNome: 'Ana',
    entradaEm: '2026-09-27T12:00:00.000Z',
    status,
    duracaoMinutos: 30,
    valorAtual: 5,
    valorMulta: null,
    janelaSaidaExpiraEm: validade,
  };
}

describe('contratações', () => {
  it('deve listar o comprovante com status e validade da API', () => {
    const itens = contratacoesConfirmadas(ticket('pago', '2026-09-27T12:10:00.000Z'), 'U3T98LX');
    assert.equal(itens.length, 1);
    assert.equal(itens[0]?.status, 'pago');
    assert.equal(itens[0]?.validade, '2026-09-27T12:10:00.000Z');
    assert.equal(itens[0]?.valor, 5);
  });

  it('deve ficar vazia enquanto o pagamento não estiver confirmado', () => {
    assert.deepEqual(contratacoesConfirmadas(ticket('ativo'), 'U3T98LX'), []);
  });
});
