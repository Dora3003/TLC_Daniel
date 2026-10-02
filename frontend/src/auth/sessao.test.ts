import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gravarSessao, lerSessao, type ArmazenamentoSessao } from './sessao.ts';

function memoria(): ArmazenamentoSessao & { valor: string | null } {
  const estado = { valor: null as string | null };
  return {
    get valor() {
      return estado.valor;
    },
    set valor(proximo: string | null) {
      estado.valor = proximo;
    },
    ler: () => estado.valor,
    gravar: (_chave, valor) => {
      estado.valor = valor;
    },
    apagar: () => {
      estado.valor = null;
    },
  };
}

describe('sessao', () => {
  it('deve recuperar o token normalizado do cliente', () => {
    const armazenamento = memoria();
    armazenamento.gravar('estacionamento.sessao', JSON.stringify({ papel: 'cliente', token: 'u3t98lx' }));
    assert.deepEqual(lerSessao(armazenamento), { papel: 'cliente', token: 'U3T98LX' });
  });

  it('deve recuperar a sessão do atendente', () => {
    const armazenamento = memoria();
    gravarSessao(armazenamento, { papel: 'atendente' });
    assert.deepEqual(lerSessao(armazenamento), { papel: 'atendente' });
  });

  it('deve descartar JSON inválido', () => {
    const armazenamento = memoria();
    armazenamento.gravar('estacionamento.sessao', '{');
    assert.equal(lerSessao(armazenamento), null);
  });

  it('deve descartar token de cliente fora do contrato', () => {
    const armazenamento = memoria();
    armazenamento.gravar('estacionamento.sessao', JSON.stringify({ papel: 'cliente', token: 'curto' }));
    assert.equal(lerSessao(armazenamento), null);
  });

  it('deve apagar a sessão ao sair', () => {
    const armazenamento = memoria();
    gravarSessao(armazenamento, { papel: 'atendente' });
    gravarSessao(armazenamento, null);
    assert.equal(lerSessao(armazenamento), null);
  });
});
