import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { autenticarAtendente } from './login.ts';

describe('login do atendente', () => {
  it('deve aceitar o e-mail e a senha da conta local', () => {
    assert.deepEqual(autenticarAtendente('  Fabricio@AutoPark.com ', 'autopark'), {
      nome: 'Fabrício da Silva',
      email: 'fabricio@autopark.com',
    });
  });

  it('deve recusar senha ou e-mail diferentes', () => {
    assert.equal(autenticarAtendente('fabricio@autopark.com', 'errada'), null);
    assert.equal(autenticarAtendente('outro@autopark.com', 'autopark'), null);
  });
});
