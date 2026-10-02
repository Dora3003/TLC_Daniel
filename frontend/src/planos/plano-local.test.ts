import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ArmazenamentoSessao } from '../auth/sessao.ts';
import { apagarPlanoId, gravarPlanoId, lerPlanoId } from './plano-local.ts';

function memoria(): ArmazenamentoSessao {
  const dados = new Map<string, string>();
  return {
    ler: (chave) => dados.get(chave) ?? null,
    gravar: (chave, valor) => {
      dados.set(chave, valor);
    },
    apagar: (chave) => {
      dados.delete(chave);
    },
  };
}

describe('plano da sessão', () => {
  it('deve recuperar o plano escolhido depois de recarregar', () => {
    const armazenamento = memoria();
    gravarPlanoId(armazenamento, 'U3T98LX', '5h');
    assert.equal(lerPlanoId(armazenamento, 'U3T98LX'), '5h');
  });

  it('deve apagar o plano ao sair', () => {
    const armazenamento = memoria();
    gravarPlanoId(armazenamento, 'U3T98LX', '1h');
    apagarPlanoId(armazenamento, 'U3T98LX');
    assert.equal(lerPlanoId(armazenamento, 'U3T98LX'), null);
  });
});
