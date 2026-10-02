import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filtrarAlocacoes, linhasAlocacao } from './alocacoes.ts';

describe('veículos alocados', () => {
  it('deve listar identificador (token), placa, motorista e data devolvidos pela API', () => {
    const linhas = linhasAlocacao([
      {
        id: ' aloc-1 ',
        placa: 'ABC1234',
        motoristaNome: ' Ana Souza ',
        entradaEm: '2026-09-27T12:00:00.000Z',
        token: ' U3T98LX ',
      },
    ]);
    assert.deepEqual(linhas, [
      {
        id: 'U3T98LX',
        placa: 'ABC1234',
        motoristaNome: 'Ana Souza',
        entradaEm: '2026-09-27T12:00:00.000Z',
      },
    ]);
  });

  it('deve ficar sem identificador quando a API não envia o token', () => {
    const linhas = linhasAlocacao([{ id: 'aloc-1', placa: 'ABC1234', entradaEm: '2026-09-27T12:00:00.000Z' }]);
    assert.equal(linhas[0]?.id, null);
    assert.notEqual(linhas[0]?.id, 'aloc-1');
  });

  it('deve filtrar por nome do motorista, token ou placa', () => {
    const linhas = linhasAlocacao([
      { token: 'AAAAAAA', placa: 'ABC1234', motoristaNome: 'Ana Souza', entradaEm: '2026-01-01T00:00:00.000Z' },
      { token: 'BBBBBBB', placa: 'XYZ9876', motoristaNome: 'Bia Lima', entradaEm: '2026-01-01T00:00:00.000Z' },
    ]);
    assert.equal(filtrarAlocacoes(linhas, 'ana').length, 1);
    assert.equal(filtrarAlocacoes(linhas, 'bbb').length, 1);
    assert.equal(filtrarAlocacoes(linhas, 'xyz').length, 1);
    assert.equal(filtrarAlocacoes(linhas, 'zzz').length, 0);
    assert.equal(filtrarAlocacoes(linhas, '  ').length, 2);
  });

  it('deve manter a lista vazia', () => {
    assert.deepEqual(linhasAlocacao([]), []);
  });
});
