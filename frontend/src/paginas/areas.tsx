import { useMemo, useState } from 'react';
import type { ApiAtendente } from '../api/atendente.ts';
import { PaginaVeiculos } from '../atendimento/alocacoes-pagina.tsx';
import { PaginaEntradaVeiculo } from '../atendimento/entrada-pagina.tsx';
import { PainelOperacao } from '../atendimento/painel-operacao.tsx';
import { PaginaVagas } from '../atendimento/vagas-pagina.tsx';
import type { ApiCliente } from '../api/cliente.ts';
import type { Plano } from '../api/tipos.ts';
import { armazenamentoDaSessao } from '../auth/sessao.ts';
import { useConsulta } from '../hooks/useConsulta.ts';
import { PaginaPagamento } from '../planos/checkout.tsx';
import { PaginaComprovante, PaginaContratacoes } from '../planos/contratacoes-pagina.tsx';
import { PaginaMulta } from '../planos/multa-pagina.tsx';
import { apagarPlanoId, gravarPlanoId, lerPlanoId } from '../planos/plano-local.ts';
import { PaginaPlanos, PaginaRevisao } from '../planos/paginas.tsx';
import { LinkInterno } from '../rotas/navegacao.tsx';

function formatarMoeda(valor: number | null): string {
  if (valor === null || Number.isNaN(valor)) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatarData(valor: string | null): string {
  if (!valor) return '—';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString('pt-BR');
}

export function AreaCliente({
  api,
  destino,
  mensagem,
  token,
  aoSair,
}: {
  api: ApiCliente;
  destino: string;
  mensagem: string | null;
  token: string;
  aoSair: () => void;
}) {
  const armazenamento = useMemo(() => armazenamentoDaSessao(), []);
  const [plano, setPlano] = useState<Plano | null>(null);

  function guardar(proximo: Plano) {
    setPlano(proximo);
    gravarPlanoId(armazenamento, token, proximo.id);
  }

  function limpar() {
    setPlano(null);
    apagarPlanoId(armazenamento, token);
  }

  function sair() {
    apagarPlanoId(armazenamento, token);
    aoSair();
  }

  const pagamento = destino === '/cliente/pagamento' || destino === '/cliente/multa';

  return (
    <div className="aplicacao autopark">
      <a className="pular" href="#conteudo">
        Ir para o conteúdo
      </a>
      <header className="barra">
        <p className="logo">AutoPark</p>
      </header>
      <div id="conteudo" className="cliente-miolo" tabIndex={-1}>
        <nav className="abas" aria-label="Cliente">
          <LinkInterno href="/cliente/planos">Tabela de valores</LinkInterno>
          <LinkInterno href="/cliente/pagamento">Pagamento</LinkInterno>
        </nav>
        {mensagem ? <p role="alert">{mensagem}</p> : null}
        {destino === '/cliente/planos' ? (
          <PaginaPlanos api={api} selecionado={plano} aoSelecionar={guardar} />
        ) : null}
        {destino === '/cliente/revisao' ? (
          <PaginaRevisao api={api} plano={plano} aoAtualizar={guardar} aoLimpar={limpar} />
        ) : null}
        {pagamento ? (
          <section className="cartao cliente-cartao">
            <header className="cliente-cabecalho">
              <p className="marca-redonda" aria-hidden="true">
                AP
              </p>
              <h1>AutoPark</h1>
              <p className="cliente-subtitulo">Pague seu ticket pela aplicação</p>
            </header>
            <PaginaPagamento api={api} token={token} planoId={lerPlanoId(armazenamento, token)} />
            <PaginaMulta api={api} token={token} embutida />
          </section>
        ) : null}
        {destino === '/cliente/contratacoes' ? <PaginaContratacoes api={api} token={token} /> : null}
        {destino === '/cliente/comprovante' ? (
          <PaginaComprovante api={api} token={token} planoId={lerPlanoId(armazenamento, token)} />
        ) : null}
        {destino === '/cliente' ? <PaginaTicket api={api} /> : null}
        <button type="button" className="link-sair" onClick={sair}>
          Sair
        </button>
      </div>
    </div>
  );
}

function PaginaTicket({ api }: { api: ApiCliente }) {
  const { estado, recarregar } = useConsulta('ticket', () => api.obterTicket());
  return (
    <main className="pagina">
      <h1>Ticket</h1>
      {estado.tipo === 'loading' ? <p role="status">Carregando ticket…</p> : null}
      {estado.tipo === 'error' ? (
        <>
          <p role="alert">{estado.mensagem}</p>
          <button type="button" onClick={recarregar}>
            Tentar novamente
          </button>
        </>
      ) : null}
      {estado.tipo === 'ready' ? (
        <dl>
          <dt>Placa</dt>
          <dd>{estado.dados.placa}</dd>
          <dt>Status</dt>
          <dd>{estado.dados.status}</dd>
          <dt>Valor</dt>
          <dd>{formatarMoeda(estado.dados.valorAtual)}</dd>
          <dt>Entrada</dt>
          <dd>{formatarData(estado.dados.entradaEm)}</dd>
        </dl>
      ) : null}
    </main>
  );
}

export function AreaAtendente({
  api,
  destino,
  mensagem,
  nome,
  aoSair,
}: {
  api: ApiAtendente;
  destino: string;
  mensagem: string | null;
  nome: string;
  aoSair: () => void;
}) {
  const [versaoPatio, setVersaoPatio] = useState(0);

  function atualizarPatio() {
    setVersaoPatio((atual) => atual + 1);
  }

  return (
    <div className="aplicacao autopark">
      <a className="pular" href="#conteudo">
        Ir para o conteúdo
      </a>
      <header className="barra">
        <p className="logo">AutoPark</p>
      </header>
      <div id="conteudo" className="miolo" tabIndex={-1}>
        <div className="topo">
          <p className="saudacao">Olá, {nome}!</p>
          <button type="button" onClick={aoSair}>
            Sair
          </button>
        </div>
        {mensagem ? <p role="alert">{mensagem}</p> : null}
        {destino === '/atendimento' ? (
          <div className="painel">
            <div className="painel-grade">
              <PaginaVagas api={api} cartao versao={versaoPatio} />
              <PainelOperacao api={api} aoSucesso={atualizarPatio} />
            </div>
            <PaginaVeiculos api={api} cartao versao={versaoPatio} />
          </div>
        ) : null}
        {destino === '/atendimento/entrada' ? <PaginaEntradaVeiculo api={api} aoSucesso={atualizarPatio} /> : null}
        {destino === '/atendimento/veiculos' ? <PaginaVeiculos api={api} versao={versaoPatio} /> : null}
      </div>
    </div>
  );
}