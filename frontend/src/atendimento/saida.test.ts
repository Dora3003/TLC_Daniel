import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { confirmacaoDaSaida } from './saida.ts';

describe('saída de veículo', () => {
  it('deve confirmar a saída com placa, horário e status da API', () => {
    assert.deepEqual(
      confirmacaoDaSaida({
        id: 'aloc-1',
        placa: 'ABC1234',
        saidaEm: '2026-09-27T12:30:00.000Z',
        status: 'finalizado',
      }),
      {
        id: 'aloc-1',
        placa: 'ABC1234',
        saidaEm: '2026-09-27T12:30:00.000Z',
        status: 'finalizado',
      },
    );
  });

  it('deve recusar confirmação sem dados oficiais', () => {
    assert.equal(confirmacaoDaSaida({ placa: 'ABC1234', token: 'U3T98LX' }), null);
  });
});
