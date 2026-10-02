import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { linhasAlocacao } from './alocacoes.ts';

describe('veículos alocados', () => {
  it('deve listar identificador, placa e data devolvidos pela API', () => {
    const linhas = linhasAlocacao([
      { id: ' aloc-1 ', placa: 'ABC1234', entradaEm: '2026-09-27T12:00:00.000Z', token: 'U3T98LX' },
    ]);
    assert.deepEqual(linhas, [
      { id: 'aloc-1', placa: 'ABC1234', entradaEm: '2026-09-27T12:00:00.000Z' },
    ]);
  });

  it('deve ficar sem identificador quando a API não envia o id', () => {
    const linhas = linhasAlocacao([{ placa: 'ABC1234', entradaEm: '2026-09-27T12:00:00.000Z', token: 'U3T98LX' }]);
    assert.equal(linhas[0]?.id, null);
    assert.notEqual(linhas[0]?.id, 'U3T98LX');
  });

  it('deve manter a lista vazia', () => {
    assert.deepEqual(linhasAlocacao([]), []);
  });
});
