import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { indicadoresOficiais, textoIndicador } from './vagas.ts';

describe('indicadores de vagas', () => {
  it('deve exibir ocupadas, capacidade e disponíveis como a API enviou', () => {
    const indicadores = indicadoresOficiais({ ocupadas: 2, capacidade: 10, disponiveis: 3 });
    assert.equal(indicadores.ocupadas, 2);
    assert.equal(indicadores.capacidade, 10);
    assert.equal(indicadores.disponiveis, 3);
    assert.equal(textoIndicador(indicadores.disponiveis), '3');
  });

  it('deve manter zero e ocultar indicador ausente', () => {
    const indicadores = indicadoresOficiais({ ocupadas: 0, capacidade: null, disponiveis: null });
    assert.equal(textoIndicador(indicadores.ocupadas), '0');
    assert.equal(textoIndicador(indicadores.capacidade), '—');
    assert.equal(textoIndicador(indicadores.disponiveis), '—');
  });

  it('deve ignorar número inválido', () => {
    const indicadores = indicadoresOficiais({ ocupadas: Number.NaN, capacidade: '10', disponiveis: undefined });
    assert.equal(indicadores.ocupadas, null);
    assert.equal(indicadores.capacidade, null);
    assert.equal(indicadores.disponiveis, null);
  });
});
