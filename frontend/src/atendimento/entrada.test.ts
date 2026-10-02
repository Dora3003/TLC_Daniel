import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { confirmacaoDaEntrada, patioLotado } from './entrada.ts';

describe('entrada de veículo', () => {
  it('deve bloquear o cadastro somente quando a API informa zero vagas', () => {
    assert.equal(patioLotado(0), true);
    assert.equal(patioLotado(1), false);
    assert.equal(patioLotado(null), false);
    assert.equal(patioLotado(undefined), false);
  });

  it('deve confirmar a entrada com identificador, placa e data da API', () => {
    const confirmacao = confirmacaoDaEntrada({
      id: ' aloc-1 ',
      placa: 'ABC1234',
      entradaEm: '2026-09-27T12:00:00.000Z',
      token: 'U3T98LX',
    });
    assert.deepEqual(confirmacao, {
      id: 'aloc-1',
      placa: 'ABC1234',
      entradaEm: '2026-09-27T12:00:00.000Z',
    });
  });

  it('deve recusar confirmação sem identificador oficial', () => {
    assert.equal(
      confirmacaoDaEntrada({ placa: 'ABC1234', entradaEm: '2026-09-27T12:00:00.000Z', token: 'U3T98LX' }),
      null,
    );
  });
});
