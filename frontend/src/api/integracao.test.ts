import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarApiAtendente } from './atendente.ts';
import { criarApiCliente } from './cliente.ts';
import { ErroApi } from './erro-api.ts';
import { criarHttp, type Http } from './http.ts';

interface Chamada {
  url: string;
  init?: RequestInit;
}

function httpDeTeste(opcoes: { status: number; corpo?: unknown; falharRede?: boolean }) {
  const chamadas: Chamada[] = [];
  const buscar: typeof fetch = async (entrada, init) => {
    chamadas.push({ url: String(entrada), init });
    if (opcoes.falharRede) throw new TypeError('Failed to fetch');
    const texto = opcoes.corpo === undefined ? '' : JSON.stringify(opcoes.corpo);
    return new Response(texto, { status: opcoes.status });
  };
  return { http: criarHttp(buscar, 'http://localhost:3000'), chamadas };
}

describe('integrações da API', () => {
  it('deve consultar somente o ticket da sessão do cliente', async () => {
    const { http, chamadas } = httpDeTeste({
      status: 200,
      corpo: {
        placa: 'ABC1234',
        motoristaNome: 'Ana',
        entradaEm: '2026-09-27T12:00:00.000Z',
        status: 'ativo',
        duracaoMinutos: 30,
        valorAtual: 5,
        valorMulta: null,
        janelaSaidaExpiraEm: null,
      },
    });
    const api = criarApiCliente(http, { papel: 'cliente', token: 'u3t98lx' });
    const ticket = await api.obterTicket();
    assert.equal(chamadas[0]?.url, 'http://localhost:3000/api/tickets/U3T98LX');
    assert.equal(ticket.valorAtual, 5);
  });

  it('deve listar o catálogo em /api/planos', async () => {
    const { http, chamadas } = httpDeTeste({
      status: 200,
      corpo: [
        {
          id: '1h',
          nome: '1 hora',
          tipo: '1h',
          preco: 5,
          moeda: 'BRL',
          validade: '1 hora',
          disponivel: true,
          regras: 'Valor oficial.',
        },
      ],
    });
    const api = criarApiCliente(http, { papel: 'cliente', token: 'U3T98LX' });
    const planos = await api.listarPlanos();
    assert.equal(chamadas[0]?.url, 'http://localhost:3000/api/planos');
    assert.equal(planos[0]?.preco, 5);
    assert.equal(planos[0]?.disponivel, true);
  });

  it('deve revalidar o plano pelo id retornado no catálogo', async () => {
    const { http, chamadas } = httpDeTeste({
      status: 200,
      corpo: {
        id: '5h',
        nome: '5 horas',
        tipo: '5h',
        preco: 25,
        moeda: 'BRL',
        validade: '5 horas',
        disponivel: true,
        regras: 'Valor oficial.',
      },
    });
    const api = criarApiCliente(http, { papel: 'cliente', token: 'U3T98LX' });
    const plano = await api.obterPlano('5h');
    assert.equal(chamadas[0]?.url, 'http://localhost:3000/api/planos/5h');
    assert.equal(plano.preco, 25);
    assert.equal(plano.validade, '5 horas');
  });

  it('deve pagar a estadia sem corpo e sem outro token', async () => {
    const { http, chamadas } = httpDeTeste({
      status: 200,
      corpo: {
        valorCobrado: 10,
        pagoEm: '2026-09-27T12:10:00.000Z',
        status: 'pago',
        janelaSaidaExpiraEm: '2026-09-27T12:20:00.000Z',
      },
    });
    const api = criarApiCliente(http, { papel: 'cliente', token: 'U3T98LX' });
    await api.pagarEstadia();
    assert.equal(chamadas[0]?.url, 'http://localhost:3000/api/tickets/U3T98LX/pagamentos');
    assert.equal(chamadas[0]?.init?.body, undefined);
  });

  it('deve pagar a multa no endpoint real', async () => {
    const { http, chamadas } = httpDeTeste({
      status: 200,
      corpo: {
        valorMulta: 1.5,
        pagoEm: '2026-09-27T12:30:00.000Z',
        status: 'pago',
        janelaSaidaExpiraEm: '2026-09-27T12:40:00.000Z',
      },
    });
    const api = criarApiCliente(http, { papel: 'cliente', token: 'U3T98LX' });
    const multa = await api.pagarMulta();
    assert.equal(chamadas[0]?.url, 'http://localhost:3000/api/tickets/U3T98LX/multas');
    assert.equal(multa.valorMulta, 1.5);
  });

  it('deve preservar o valor da multa retornado no erro 409', async () => {
    const { http } = httpDeTeste({
      status: 409,
      corpo: { erro: 'JANELA_SAIDA_EXPIRADA', mensagem: 'Janela de saída expirada', valorMulta: 1.5 },
    });
    const api = criarApiCliente(http, { papel: 'cliente', token: 'U3T98LX' });
    await assert.rejects(api.obterTicket(), (erro: unknown) => {
      assert.ok(erro instanceof ErroApi);
      assert.equal(erro.codigo, 'JANELA_SAIDA_EXPIRADA');
      assert.equal(erro.valorMulta, 1.5);
      assert.equal(erro.message, 'Janela de saída expirada');
      return true;
    });
  });

  it('deve usar mensagem genérica quando o erro não segue o contrato', async () => {
    const { http } = httpDeTeste({ status: 500, corpo: '<html>erro</html>' });
    const api = criarApiCliente(http, { papel: 'cliente', token: 'U3T98LX' });
    await assert.rejects(api.obterTicket(), (erro: unknown) => {
      assert.ok(erro instanceof ErroApi);
      assert.equal(erro.message, 'Não foi possível concluir a operação. Tente novamente.');
      return true;
    });
  });

  it('deve tratar falha de rede sem expor a URL', async () => {
    const { http } = httpDeTeste({ status: 200, falharRede: true });
    const api = criarApiCliente(http, { papel: 'cliente', token: 'U3T98LX' });
    await assert.rejects(api.obterTicket(), (erro: unknown) => {
      assert.ok(erro instanceof ErroApi);
      assert.equal(erro.codigo, 'ERRO_REDE');
      assert.equal(erro.message.includes('U3T98LX'), false);
      return true;
    });
  });

  it('não deve chamar a API com token inválido', async () => {
    const { http, chamadas } = httpDeTeste({ status: 200, corpo: {} });
    assert.throws(() => criarApiCliente(http, { papel: 'cliente', token: '123' }), ErroApi);
    assert.equal(chamadas.length, 0);
  });

  it('deve limitar o cliente a ticket, catálogo, pagamento e multa', () => {
    const api = criarApiCliente({} as Http, { papel: 'cliente', token: 'U3T98LX' });
    assert.deepEqual(Object.keys(api).sort(), ['listarPlanos', 'obterPlano', 'obterTicket', 'pagarEstadia', 'pagarMulta']);
  });

  it('deve registrar entrada apenas em /api/entrada', async () => {
    const { http, chamadas } = httpDeTeste({
      status: 201,
      corpo: {
        id: '1',
        placa: 'ABC1234',
        motoristaNome: 'Ana',
        modelo: null,
        cor: null,
        token: 'U3T98LX',
        loginUrl: 'http://localhost:5173/?token=U3T98LX',
        entradaEm: '2026-09-27T12:00:00.000Z',
        status: 'ativo',
      },
    });
    const api = criarApiAtendente(http);
    await api.registrarEntrada({ placa: 'ABC-1234', motoristaNome: 'Ana' });
    assert.equal(chamadas[0]?.url, 'http://localhost:3000/api/entrada');
    assert.equal(chamadas[0]?.init?.body, JSON.stringify({ placa: 'ABC-1234', motoristaNome: 'Ana' }));
  });

  it('deve consultar a ocupação oficial em /api/ocupacao', async () => {
    const { http, chamadas } = httpDeTeste({
      status: 200,
      corpo: { ocupadas: 2, capacidade: null, disponiveis: null },
    });
    const api = criarApiAtendente(http);
    const ocupacao = await api.obterOcupacao();
    assert.equal(chamadas[0]?.url, 'http://localhost:3000/api/ocupacao');
    assert.equal(ocupacao.ocupadas, 2);
    assert.equal(ocupacao.capacidade, null);
    assert.equal(ocupacao.disponiveis, null);
  });

  it('deve tratar pátio vazio como lista vazia', async () => {
    const { http, chamadas } = httpDeTeste({ status: 200, corpo: [] });
    const api = criarApiAtendente(http);
    const ativos = await api.listarAtivos();
    assert.equal(chamadas[0]?.url, 'http://localhost:3000/api/ativos');
    assert.deepEqual(ativos, []);
  });

  it('deve consultar histórico pela placa informada', async () => {
    const { http, chamadas } = httpDeTeste({ status: 200, corpo: [] });
    const api = criarApiAtendente(http);
    await api.historico('ABC-1234');
    assert.equal(chamadas[0]?.url, 'http://localhost:3000/api/historico/ABC-1234');
  });

  it('deve limitar o atendente a entrada, ocupação, pátio e histórico', () => {
    const api = criarApiAtendente({} as Http);
    assert.deepEqual(Object.keys(api).sort(), ['historico', 'listarAtivos', 'obterOcupacao', 'registrarEntrada']);
  });
});
