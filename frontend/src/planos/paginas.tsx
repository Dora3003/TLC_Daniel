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

  function continuar() {
    if (!podeAvancar(selecionado)) return;
    navegar('/cliente/revisao');
  }

  return (
    <section className="cartao cliente-cartao">
      <p className="marca-redonda" aria-hidden="true">
        AP
      </p>
      <h1>AutoPark</h1>
      <p>Pague seu ticket pela aplicação</p>
      <p className="periodo">Escolha o período de estacionamento</p>
      {estado.tipo === 'loading' ? <p role="status">Carregando planos…</p> : null}
      {estado.tipo === 'error' ? (
        <>
          <p role="alert">{estado.mensagem}</p>
          <button type="button" onClick={recarregar}>
            Tentar novamente
          </button>
        </>
      ) : null}
      {estado.tipo === 'empty' ? <p>Não há planos disponíveis no momento.</p> : null}
      {estado.tipo === 'ready' ? (
        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            continuar();
          }}
        >
          <div className="planos" role="radiogroup" aria-label="Escolha um plano">
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
                <span>
                  {formatarMoeda(plano.preco)}
                  <span aria-hidden="true"> ›</span>
                </span>
              </button>
            ))}
          </div>
          <button type="submit" disabled={!podeAvancar(selecionado)}>
            Continuar para revisão
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
      <main className="pagina">
        <h1>Revisão</h1>
        <p>Selecione um plano para revisar.</p>
        <button type="button" onClick={() => navegar('/cliente/planos')}>
          Voltar aos planos
        </button>
      </main>
    );
  }

  const confirmado =
    confirmacao.estado.tipo === 'ready' &&
    confirmacao.estado.dados.preco === plano.preco &&
    confirmacao.estado.dados.validade === plano.validade &&
    confirmacao.estado.dados.regras === plano.regras &&
    confirmacao.estado.dados.disponivel;

  return (
    <main className="pagina">
      <h1>Revisão</h1>
      {ticket.estado.tipo === 'loading' ? <p role="status">Carregando dados do ticket…</p> : null}
      {ticket.estado.tipo === 'error' ? (
        <>
          <p role="alert">{ticket.estado.mensagem}</p>
          <button type="button" onClick={ticket.recarregar}>
            Tentar novamente
          </button>
        </>
      ) : null}
      <dl>
        <dt>Placa</dt>
        <dd>{ticket.estado.tipo === 'ready' ? ticket.estado.dados.placa : '—'}</dd>
        <dt>Plano</dt>
        <dd>{plano.nome}</dd>
        <dt>Preço</dt>
        <dd>{formatarMoeda(plano.preco)}</dd>
        <dt>Validade</dt>
        <dd>{plano.validade}</dd>
        <dt>Regras</dt>
        <dd>{plano.regras}</dd>
      </dl>
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
    </main>
  );
}
