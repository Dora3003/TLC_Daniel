import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ErroApi } from '../api/erro-api.ts';
import type { MultaPaga, Ticket } from '../api/tipos.ts';
import {
  cobrancaIndicada,
  cobrancaQuitada,
  comprovanteDaConsulta,
  comprovanteDaResposta,
  pagarMultaUmaVez,
} from './multa.ts';

function ticket(parcial: Partial<Ticket> = {}): Ticket {
  return {
    placa: 'ABC1234',
    motoristaNome: 'Ana',
    entradaEm: '2026-09-27T12:00:00.000Z',
    status: 'multa_pendente',
    duracaoMinutos: 80,
    valorAtual: 10,
    valorMulta: 1.5,
    janelaSaidaExpiraEm: null,
    ...parcial,
  };
}

describe('cobrança adicional', () => {
  it('deve indicar a cobrança somente com status e valor da API', () => {
    assert.equal(cobrancaIndicada(ticket()), true);
    assert.equal(cobrancaIndicada(ticket({ valorMulta: 0 })), true);
  });

  it('deve ocultar a cobrança quando a API não informa multa pendente', () => {
    assert.equal(cobrancaIndicada(ticket({ status: 'ativo', valorMulta: null })), false);
    assert.equal(cobrancaIndicada(ticket({ status: 'pago', valorMulta: 1.5 })), false);
    assert.equal(cobrancaIndicada(ticket({ valorMulta: null })), false);
  });

  it('deve reconhecer a cobrança quitada pelos campos persistidos na API', () => {
    assert.equal(cobrancaQuitada(ticket({ status: 'pago', valorMulta: 1.5 })), true);
    assert.equal(cobrancaQuitada(ticket({ status: 'pago', valorMulta: null })), false);
    assert.equal(cobrancaQuitada(ticket()), false);
  });

  it('deve montar o comprovante com o valor retornado, sem recalcular', () => {
    const dados = comprovanteDaConsulta(
      ticket({ status: 'pago', valorMulta: 1.5, janelaSaidaExpiraEm: '2026-09-27T13:10:00.000Z' }),
      'U3T98LX',
    );
    assert.equal(dados?.valor, 1.5);
    assert.equal(dados?.status, 'pago');
    assert.equal(dados?.placa, 'ABC1234');
    assert.equal(dados?.identificador, 'U3T98LX');
    assert.equal(dados?.pagoEm, null);
  });

  it('deve recusar comprovante sem confirmação oficial', () => {
    assert.equal(comprovanteDaConsulta(ticket(), 'U3T98LX'), null);
    assert.equal(
      comprovanteDaResposta(ticket(), { valorMulta: 1.5, pagoEm: '2026-09-27T13:00:00.000Z', status: 'em_analise', janelaSaidaExpiraEm: '2026-09-27T13:10:00.000Z' }, 'U3T98LX'),
      null,
    );
  });
});

describe('pagamento da cobrança adicional', () => {
  it('deve pagar uma vez e confirmar o valor oficial', async () => {
    let posts = 0;
    const resultado = await pagarMultaUmaVez({
      obterTicket: async () => ticket(),
      pagarMulta: async () => {
        posts += 1;
        return resposta();
      },
    });
    assert.equal(posts, 1);
    assert.equal(resultado.tipo, 'confirmada');
    if (resultado.tipo === 'confirmada') assert.equal(resultado.multa.valorMulta, 1.5);
  });

  it('não deve chamar o pagamento quando não há cobrança indicada', async () => {
    let posts = 0;
    const resultado = await pagarMultaUmaVez({
      obterTicket: async () => ticket({ status: 'ativo', valorMulta: null }),
      pagarMulta: async () => {
        posts += 1;
        return resposta();
      },
    });
    assert.equal(posts, 0);
    assert.equal(resultado.tipo, 'ausente');
  });

  it('não deve confirmar quando a resposta não está paga', async () => {
    await assert.rejects(
      () =>
        pagarMultaUmaVez({
          obterTicket: async () => ticket(),
          pagarMulta: async () => resposta({ status: 'em_analise' }),
        }),
      (erro: unknown) => erro instanceof ErroApi && erro.codigo === 'PAGAMENTO_EM_ANALISE',
    );
  });

  it('deve consultar de novo após multa já inexistente e não confirmar sem status pago', async () => {
    let consultas = 0;
    const resultado = await pagarMultaUmaVez({
      obterTicket: async () => {
        consultas += 1;
        return consultas === 1 ? ticket() : ticket({ status: 'ativo', valorMulta: null });
      },
      pagarMulta: async () => {
        throw new ErroApi(409, 'MULTA_NAO_PENDENTE', 'Não há multa pendente para este ticket');
      },
    });
    assert.equal(consultas, 2);
    assert.equal(resultado.tipo, 'ausente');
    if (resultado.tipo === 'ausente') assert.equal(comprovanteDaConsulta(resultado.ticket, 'U3T98LX'), null);
  });
});

function resposta(parcial: Partial<MultaPaga> = {}): MultaPaga {
  return {
    valorMulta: 1.5,
    pagoEm: '2026-09-27T13:00:00.000Z',
    status: 'pago',
    janelaSaidaExpiraEm: '2026-09-27T13:10:00.000Z',
    ...parcial,
  };
}
