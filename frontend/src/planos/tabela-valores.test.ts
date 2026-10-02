import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { catalogoTarifaOficial, planoPorId } from './tabela-valores.ts';

describe('tabela de valores', () => {
  it('deve expor a tarifa oficial de R$ 5,00 por hora', () => {
    const planos = catalogoTarifaOficial();
    assert.equal(planos[0]?.preco, 5);
    assert.equal(planos[1]?.preco, 10);
    assert.equal(planoPorId('5h')?.preco, 25);
    assert.equal(planoPorId('inexistente'), null);
  });
});
