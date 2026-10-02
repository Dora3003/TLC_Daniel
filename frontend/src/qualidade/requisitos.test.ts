import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ErroApi, mensagemDoErro } from '../api/erro-api.ts';
import type { Plano, Ticket } from '../api/tipos.ts';
import { linhasAlocacao } from '../atendimento/alocacoes.ts';
import { confirmacaoDaEntrada, patioLotado } from '../atendimento/entrada.ts';
import { indicadoresOficiais } from '../atendimento/vagas.ts';
import { decidirAcesso } from '../auth/acesso.ts';
import { reservarEnvio, liberarEnvio } from '../hooks/useMutacao.ts';
import { contratacoesConfirmadas } from '../planos/contratacoes.ts';
import {
  cobrancaIndicada,
  comprovanteDaResposta,
  pagarMultaUmaVez,
} from '../planos/multa.ts';
import {
  codigosDoPagamento,
  pagamentoConfirmado,
  pagarUmaVez,
} from '../planos/pagamento.ts';
import { decidirRevisao, podeAvancar } from '../planos/selecao.ts';

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

function ticket(parcial: Partial<Ticket> = {}): Ticket {
  return {
    placa: 'ABC1234',
    motoristaNome: 'Ana',
    entradaEm: '2026-09-27T12:00:00.000Z',
    status: 'ativo',
    duracaoMinutos: 80,
    valorAtual: 10,
    valorMulta: null,
    janelaSaidaExpiraEm: null,
    ...parcial,
  };
}

describe('PARK-01 a PARK-27', () => {
  it('PARK-01 e PARK-03 avançam só com um plano disponível vindo da API', () => {
    assert.equal(podeAvancar(plano({ disponivel: true })), true);
    assert.equal(podeAvancar(plano({ disponivel: false })), false);
    assert.equal(podeAvancar(null), false);
  });

  it('PARK-02 e PARK-04 usam nome, preço, validade e regras sem recalcular', () => {
    const atual = plano({ nome: '5 horas', preco: 25, validade: '5 horas', regras: 'Tarifa oficial.' });
    assert.equal(decidirRevisao(atual, { ...atual }), 'igual');
    assert.equal(atual.preco, 25);
  });

  it('PARK-05 confirma um pagamento pago e recusa status em análise', async () => {
    let posts = 0;
    const confirmado = await pagarUmaVez({
      obterTicket: async () => ticket(),
      pagarEstadia: async () => {
        posts += 1;
        return {
          valorCobrado: 10,
          pagoEm: '2026-09-27T13:00:00.000Z',
          status: 'pago',
          janelaSaidaExpiraEm: '2026-09-27T13:10:00.000Z',
        };
      },
    });
    assert.equal(posts, 1);
    assert.equal(confirmado.pagamento?.status, 'pago');
    await assert.rejects(
      () =>
        pagarUmaVez({
          obterTicket: async () => ticket(),
          pagarEstadia: async () => ({
            valorCobrado: 10,
            pagoEm: '2026-09-27T13:00:00.000Z',
            status: 'em_analise',
            janelaSaidaExpiraEm: '2026-09-27T13:10:00.000Z',
          }),
        }),
      (erro: unknown) => erro instanceof ErroApi && erro.codigo === 'PAGAMENTO_EM_ANALISE',
    );
  });

  it('PARK-06 só lista contratação com status pago e validade da API', () => {
    const itens = contratacoesConfirmadas(ticket({ status: 'pago', valorAtual: 10, janelaSaidaExpiraEm: '2026-09-27T13:10:00.000Z' }), 'U3T98LX');
    assert.equal(itens[0]?.status, 'pago');
    assert.equal(itens[0]?.validade, '2026-09-27T13:10:00.000Z');
    assert.equal(pagamentoConfirmado('em_analise'), false);
  });

  it('PARK-07 falha de pagamento não confirma a contratação', async () => {
    await assert.rejects(
      () =>
        pagarUmaVez({
          obterTicket: async () => ticket(),
          pagarEstadia: async () => {
            throw new ErroApi(402, 'PAGAMENTO_PENDENTE', 'Pagamento pendente');
          },
        }),
      (erro: unknown) => erro instanceof ErroApi && erro.codigo === 'PAGAMENTO_PENDENTE',
    );
  });

  it('PARK-08 bloqueia uma segunda submissão enquanto a primeira segue', () => {
    const trava = { ocupada: false };
    assert.equal(reservarEnvio(trava), true);
    assert.equal(reservarEnvio(trava), false);
    liberarEnvio(trava);
    assert.equal(reservarEnvio(trava), true);
  });

  it('PARK-09 ignora QR e código ausentes e usa só o que a API devolve', () => {
    assert.deepEqual(codigosDoPagamento({}), { qrCode: null, codigo: null });
    assert.equal(codigosDoPagamento({ codigo: ' PIX-1 ' }).codigo, 'PIX-1');
  });

  it('PARK-10 deixa a lista vazia sem pagamento confirmado', () => {
    assert.deepEqual(contratacoesConfirmadas(ticket({ status: 'ativo' }), 'U3T98LX'), []);
  });

  it('PARK-11 e PARK-15 mostram a cobrança só com status e valor oficiais', () => {
    const pendente = ticket({ status: 'multa_pendente', valorMulta: 1.5 });
    assert.equal(cobrancaIndicada(pendente), true);
    assert.equal(pendente.valorMulta, 1.5);
    assert.equal(cobrancaIndicada(ticket({ status: 'pago', valorMulta: null })), false);
  });

  it('PARK-12 e PARK-13 pagam a cobrança uma vez e só confirmam status pago', async () => {
    let posts = 0;
    const resultado = await pagarMultaUmaVez({
      obterTicket: async () => ticket({ status: 'multa_pendente', valorMulta: 1.5 }),
      pagarMulta: async () => {
        posts += 1;
        return {
          valorMulta: 1.5,
          pagoEm: '2026-09-27T13:00:00.000Z',
          status: 'pago',
          janelaSaidaExpiraEm: '2026-09-27T13:10:00.000Z',
        };
      },
    });
    assert.equal(posts, 1);
    assert.equal(resultado.tipo, 'confirmada');
    await assert.rejects(
      () =>
        pagarMultaUmaVez({
          obterTicket: async () => ticket({ status: 'multa_pendente', valorMulta: 1.5 }),
          pagarMulta: async () => ({
            valorMulta: 1.5,
            pagoEm: '2026-09-27T13:00:00.000Z',
            status: 'em_analise',
            janelaSaidaExpiraEm: '2026-09-27T13:10:00.000Z',
          }),
        }),
      (erro: unknown) => erro instanceof ErroApi && erro.codigo === 'PAGAMENTO_EM_ANALISE',
    );
  });

  it('PARK-14 identifica placa, valor, status e identificador da cobrança confirmada', () => {
    const dados = comprovanteDaResposta(
      ticket({ status: 'multa_pendente', placa: 'ABC1234', valorMulta: 1.5 }),
      {
        valorMulta: 1.5,
        pagoEm: '2026-09-27T13:00:00.000Z',
        status: 'pago',
        janelaSaidaExpiraEm: '2026-09-27T13:10:00.000Z',
      },
      'U3T98LX',
    );
    assert.equal(dados?.identificador, 'U3T98LX');
    assert.equal(dados?.placa, 'ABC1234');
    assert.equal(dados?.valor, 1.5);
    assert.equal(dados?.status, 'pago');
  });

  it('PARK-16 e PARK-17 substituem os indicadores pela consulta seguinte', () => {
    const antes = indicadoresOficiais({ ocupadas: 1, capacidade: null, disponiveis: null });
    const depois = indicadoresOficiais({ ocupadas: 2, capacidade: 10, disponiveis: 8 });
    assert.equal(antes.ocupadas, 1);
    assert.equal(depois.ocupadas, 2);
    assert.equal(depois.capacidade, 10);
    assert.equal(depois.disponiveis, 8);
  });

  it('PARK-18 e PARK-19 confirmam placa, identificador e data da entrada', () => {
    const confirmacao = confirmacaoDaEntrada({
      id: 'aloc-1',
      placa: 'ABC1234',
      entradaEm: '2026-09-27T12:00:00.000Z',
    });
    assert.deepEqual(confirmacao, {
      id: 'aloc-1',
      placa: 'ABC1234',
      entradaEm: '2026-09-27T12:00:00.000Z',
    });
  });

  it('PARK-20 lista id, placa e data e aceita pátio vazio', () => {
    assert.deepEqual(linhasAlocacao([]), []);
    assert.equal(linhasAlocacao([{ id: 'aloc-1', placa: 'ABC1234', entradaEm: '2026-09-27T12:00:00.000Z' }])[0]?.id, 'aloc-1');
  });

  it('PARK-21 preserva a mensagem de placa duplicada e não confirma a entrada', () => {
    const erro = new ErroApi(409, 'PLACA_JA_ATIVA', 'Veículo já está no estacionamento');
    assert.equal(mensagemDoErro(erro), 'Veículo já está no estacionamento');
    assert.equal(confirmacaoDaEntrada({ placa: 'ABC1234', token: 'U3T98LX' }), null);
  });

  it('PARK-22 bloqueia o cadastro quando a API informa zero vagas', () => {
    assert.equal(patioLotado(0), true);
    assert.equal(patioLotado(null), false);
  });

  it('PARK-23 separa cliente e atendente', () => {
    const cliente = { papel: 'cliente' as const, token: 'U3T98LX' };
    assert.equal(decidirAcesso('/atendimento', '', cliente).permitido, false);
    assert.equal(decidirAcesso('/cliente/pagamento', '', { papel: 'atendente' }).permitido, false);
  });

  it('PARK-25 anuncia erro em texto e mantém foco visível no teclado', () => {
    const css = readFileSync(new URL('../App.css', import.meta.url), 'utf8');
    const areas = readFileSync(new URL('../paginas/areas.tsx', import.meta.url), 'utf8');
    assert.match(css, /focus-visible/);
    assert.match(areas, /role="alert"/);
    assert.match(areas, /Ir para o conteúdo/);
  });

  it('PARK-24 usa mensagem recuperável sem detalhe técnico de rede', () => {
    assert.equal(mensagemDoErro(new TypeError('Failed to fetch http://localhost:3000')), 'Não foi possível concluir a operação. Tente novamente.');
  });

  it('PARK-26 não deduz vaga livre nem preço a partir de dados locais', () => {
    const indicadores = indicadoresOficiais({ ocupadas: 2, capacidade: 10, disponiveis: 3 });
    assert.equal(indicadores.disponiveis, 3);
    assert.equal(decidirRevisao(plano({ preco: 5 }), plano({ preco: 25 })), 'alterado');
  });

  it('PARK-27 consulta o ticket antes de um novo pagamento', async () => {
    let posts = 0;
    const resultado = await pagarUmaVez({
      obterTicket: async () => ticket({ status: 'pago' }),
      pagarEstadia: async () => {
        posts += 1;
        return {
          valorCobrado: 10,
          pagoEm: '2026-09-27T13:00:00.000Z',
          status: 'pago',
          janelaSaidaExpiraEm: '2026-09-27T13:10:00.000Z',
        };
      },
    });
    assert.equal(posts, 0);
    assert.equal(resultado.pagamento, null);
    assert.equal(resultado.ticket.status, 'pago');
  });
});
