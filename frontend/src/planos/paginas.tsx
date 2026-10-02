import type { ApiCliente } from '../api/cliente.ts';
import { ErroApi } from '../api/erro-api.ts';
import type { Plano } from '../api/tipos.ts';
import { useConsulta } from '../hooks/useConsulta.ts';
import { useMutacao } from '../hooks/useMutacao.ts';
import { BotaoPagamento } from './checkout.tsx';
import { podeAvancar, decidirRevisao } from './selecao.ts';
import { useNavegacao } from '../rotas/contexto-navegacao.ts';

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function listaVazia(planos: readonly Plano[]): boolean {
  return planos.length === 0;
}

export function PaginaPlanos({
  api,
  selecionado,
  aoSelecionar,
}: {
  api: ApiCliente;
  selecionado: Plano | null;
  aoSelecionar: (plano: Plano) => void;
}) {
  const { navegar } = useNavegacao();
  const { estado, recarregar } = useConsulta('planos', () => api.listarPlanos(), listaVazia);
  const ticket = useConsulta('planos-ticket', () => api.obterTicket());

  function continuar() {
    if (!podeAvancar(selecionado)) return;
    navegar('/cliente/revisao');
  }

  return (
    <section className="cartao cliente-cartao">
      <header className="cliente-cabecalho">
        <p className="marca-redonda" aria-hidden="true">
          AP
        </p>
        <h1>AutoPark</h1>
        <p className="cliente-subtitulo">Pague seu ticket pela aplicação</p>
      </header>

      <p className="periodo">Tabela de valores</p>
      <p className="dica">R$ 5,00 por hora. Mínimo de 1 hora.</p>

      {ticket.estado.tipo === 'ready' ? (
        <section className="comprovante" aria-label="Valor atual do ticket">
          <h2>Sua estadia</h2>
          <dl className="lista-dados">
            <div>
              <dt>Placa</dt>
              <dd>{ticket.estado.dados.placa}</dd>
            </div>
            <div>
              <dt>Tempo</dt>
              <dd>{ticket.estado.dados.duracaoMinutos} min</dd>
            </div>
            <div>
              <dt>Valor atual</dt>
              <dd>{formatarMoeda(ticket.estado.dados.valorAtual)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className="status-pill">{ticket.estado.dados.status}</span>
              </dd>
            </div>
          </dl>
        </section>
      ) : null}
      {ticket.estado.tipo === 'error' ? (
        <div className="cartao-feedback">
          <p role="alert">{ticket.estado.mensagem}</p>
          <button type="button" className="botao-secundario" onClick={ticket.recarregar}>
            Atualizar ticket
          </button>
        </div>
      ) : null}

      {estado.tipo === 'loading' ? <p role="status">Carregando tabela de valores…</p> : null}
      {estado.tipo === 'error' ? (
        <div className="cartao-feedback">
          <p role="alert">{estado.mensagem}</p>
          <button type="button" onClick={recarregar}>
            Tentar novamente
          </button>
        </div>
      ) : null}
      {estado.tipo === 'empty' ? <p>Não há valores disponíveis no momento.</p> : null}
      {estado.tipo === 'ready' ? (
        <form
          className="formulario-cadastro"
          onSubmit={(evento) => {
            evento.preventDefault();
            continuar();
          }}
        >
          <div className="planos" role="radiogroup" aria-label="Tabela de valores por período">
            {estado.dados.map((plano) => (
              <button
                key={plano.id}
                type="button"
                className="plano-linha"
                role="radio"
                aria-checked={selecionado?.id === plano.id}
                disabled={!plano.disponivel}
                onClick={() => aoSelecionar(plano)}
              >
                <span>
                  <span className="plano-nome">{plano.nome}</span>
                  <span className="plano-validade">{plano.validade}</span>
                </span>
                <span>{formatarMoeda(plano.preco)}</span>
              </button>
            ))}
          </div>
          <button type="submit" disabled={!podeAvancar(selecionado)}>
            Continuar para revisão
          </button>
          <button type="button" className="botao-secundario botao-largo" onClick={() => navegar('/cliente/pagamento')}>
            Ir para pagamento
          </button>
        </form>
      ) : null}
    </section>
  );
}

export function PaginaRevisao({
  api,
  plano,
  aoAtualizar,
  aoLimpar,
}: {
  api: ApiCliente;
  plano: Plano | null;
  aoAtualizar: (plano: Plano) => void;
  aoLimpar: () => void;
}) {
  const { navegar } = useNavegacao();
  const ticket = useConsulta(plano ? 'revisao-ticket' : null, () => api.obterTicket());
  const confirmacao = useMutacao(async () => {
    if (!plano || !podeAvancar(plano)) {
      aoLimpar();
      throw new ErroApi(409, 'PLANO_INDISPONIVEL', 'Este plano não está mais disponível. Escolha outro.');
    }
    const atual = await api.obterPlano(plano.id);
    const resultado = decidirRevisao(plano, atual);
    if (resultado === 'indisponivel') {
      aoLimpar();
      throw new ErroApi(409, 'PLANO_INDISPONIVEL', 'Este plano não está mais disponível. Escolha outro.');
    }
    if (resultado === 'alterado') {
      aoAtualizar(atual);
      throw new ErroApi(
        409,
        'PLANO_ALTERADO',
        'Os dados do plano foram atualizados. Confira novamente antes de continuar.',
      );
    }
    return atual;
  });

  if (!plano) {
    return (
      <section className="cartao cliente-cartao">
        <h1>Revisão</h1>
        <p>Selecione um período na tabela de valores para revisar.</p>
        <button type="button" onClick={() => navegar('/cliente/planos')}>
          Voltar à tabela de valores
        </button>
      </section>
    );
  }

  const confirmado =
    confirmacao.estado.tipo === 'ready' &&
    confirmacao.estado.dados.preco === plano.preco &&
    confirmacao.estado.dados.validade === plano.validade &&
    confirmacao.estado.dados.regras === plano.regras &&
    confirmacao.estado.dados.disponivel;

  return (
    <section className="cartao cliente-cartao">
      <header className="cliente-cabecalho">
        <p className="marca-redonda" aria-hidden="true">
          AP
        </p>
        <h1>Revisão</h1>
        <p className="cliente-subtitulo">Confira os dados antes do pagamento</p>
      </header>
      {ticket.estado.tipo === 'loading' ? <p role="status">Carregando dados do ticket…</p> : null}
      {ticket.estado.tipo === 'error' ? (
        <div className="cartao-feedback">
          <p role="alert">{ticket.estado.mensagem}</p>
          <button type="button" onClick={ticket.recarregar}>
            Tentar novamente
          </button>
        </div>
      ) : null}
      <section className="comprovante">
        <dl className="lista-dados">
          <div>
            <dt>Placa</dt>
            <dd>{ticket.estado.tipo === 'ready' ? ticket.estado.dados.placa : '—'}</dd>
          </div>
          <div>
            <dt>Período</dt>
            <dd>{plano.nome}</dd>
          </div>
          <div>
            <dt>Preço de referência</dt>
            <dd>{formatarMoeda(plano.preco)}</dd>
          </div>
          <div>
            <dt>Validade</dt>
            <dd>{plano.validade}</dd>
          </div>
          <div>
            <dt>Regras</dt>
            <dd>{plano.regras}</dd>
          </div>
        </dl>
      </section>
      <button
        type="button"
        onClick={() => void confirmacao.enviar()}
        disabled={confirmacao.estado.tipo === 'submitting' || ticket.estado.tipo !== 'ready'}
      >
        {confirmacao.estado.tipo === 'submitting' ? 'Conferindo dados…' : 'Confirmar dados'}
      </button>
      {confirmacao.estado.tipo === 'error' ? <p role="alert">{confirmacao.estado.mensagem}</p> : null}
      {confirmado ? <p role="status">Dados confirmados.</p> : null}
      <BotaoPagamento confirmado={confirmado} />
    </section>
  );
}
