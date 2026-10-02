import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Plano } from '../api/tipos.ts';
import { podeAvancar, decidirRevisao } from './selecao.ts';

function plano(parcial: Partial<Plano> = {}): Plano {
  return {
    id: '1h',
    nome: '1 hora',
    tipo: '1h',
    preco: 5,
    moeda: 'BRL',
    validade: '1 hora',
    disponivel: true,
    regras: 'Valor oficial.',
    ...parcial,
  };
}

describe('seleção de plano', () => {
  it('deve permitir avançar somente com um plano disponível', () => {
    assert.equal(podeAvancar(plano()), true);
  });

  it('deve impedir avanço quando o plano está indisponível', () => {
    assert.equal(podeAvancar(plano({ disponivel: false })), false);
  });

  it('deve impedir avanço sem seleção', () => {
    assert.equal(podeAvancar(null), false);
  });
});

describe('revisão do plano', () => {
  it('deve confirmar quando preço, validade e regras permanecem iguais', () => {
    const atual = plano();
    assert.equal(decidirRevisao(atual, { ...atual }), 'igual');
  });

  it('deve exigir nova confirmação quando o preço muda', () => {
    assert.equal(decidirRevisao(plano(), plano({ preco: 10 })), 'alterado');
  });

  it('deve exigir nova confirmação quando a validade muda', () => {
    assert.equal(decidirRevisao(plano(), plano({ validade: '2 horas' })), 'alterado');
  });

  it('deve bloquear a revisão quando o plano deixa de estar disponível', () => {
    assert.equal(decidirRevisao(plano(), plano({ disponivel: false, preco: 10 })), 'indisponivel');
  });
});
