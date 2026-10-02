import { useState } from 'react';
import type { ApiCliente } from '../api/cliente.ts';
import type { Pagamento, Plano, Ticket } from '../api/tipos.ts';
import { useConsulta } from '../hooks/useConsulta.ts';
import { useMutacao } from '../hooks/useMutacao.ts';
import { useNavegacao } from '../rotas/contexto-navegacao.ts';
import {
  codigoCopiavel,
  codigosDoPagamento,
  pagamentoConfirmado,
  pagarUmaVez,
  podeIniciarPagamento,
  qrEhImagem,
} from './pagamento.ts';

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatarData(valor: string | null): string {
  if (!valor) return '—';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString('pt-BR');
}

export function PaginaPagamento({
  api,
  token,
  planoId,
}: {
  api: ApiCliente;
  token: string;
  planoId: string | null;
}) {
  const ticket = useConsulta('pagamento-ticket', () => api.obterTicket());
  const plano = useConsulta(planoId ? `pagamento-plano-${planoId}` : null, () => api.obterPlano(planoId!));
  const pagamento = useMutacao(() => pagarUmaVez(api));
  const daMutacao =
    pagamento.estado.tipo === 'ready' && resultadoConfirmado(pagamento.estado.dados)
      ? pagamento.estado.dados
      : null;
  const daConsulta =
    ticket.estado.tipo === 'ready' && pagamentoConfirmado(ticket.estado.dados.status)
      ? { ticket: ticket.estado.dados, pagamento: null }
      : null;
  const oficial = daMutacao ?? daConsulta;

  const ocupado = pagamento.estado.tipo === 'submitting';
  const podePagar =
    ticket.estado.tipo === 'ready' && podeIniciarPagamento(ticket.estado.dados.status) && oficial === null;

  return (
    <section className="pagamento-bloco">
      <div className="pagamento-formulario">
        <label>
          Token
          <input value={token} readOnly />
        </label>
        {ticket.estado.tipo === 'loading' ? <p role="status">Consultando o status do pagamento…</p> : null}
        {ticket.estado.tipo === 'error' ? (
          <div className="cartao-feedback">
            <p role="alert">{ticket.estado.mensagem}</p>
            <button type="button" onClick={ticket.recarregar}>
              Tentar novamente
            </button>
          </div>
        ) : null}
        {ocupado ? <p role="status">Processando pagamento…</p> : null}
        <button type="button" onClick={() => void pagamento.enviar()} disabled={!podePagar || ocupado}>
          Gerar QR Code
        </button>
        <p className="dica">Utilize o token do seu ticket para pagar a estadia.</p>
        {pagamento.estado.tipo === 'error' ? <p role="alert">{pagamento.estado.mensagem}</p> : null}
      </div>

      {oficial ? (
        <Comprovante
          identificador={token}
          ticket={oficial.ticket}
          pagamento={oficial.pagamento}
          plano={plano.estado.tipo === 'ready' ? plano.estado.dados : null}
        />
      ) : null}

      <p className="dica dica-saida">
        Você tem até 10 minutos para realizar a saída. Depois desse prazo, pode haver cobrança adicional.
      </p>
    </section>
  );
}

function resultadoConfirmado(resultado: { ticket: Ticket; pagamento: Pagamento | null }): boolean {
  if (resultado.pagamento) return pagamentoConfirmado(resultado.pagamento.status);
  return pagamentoConfirmado(resultado.ticket.status);
}

export function Comprovante({
  identificador,
  ticket,
  pagamento,
  plano,
}: {
  identificador: string;
  ticket: Ticket;
  pagamento: Pagamento | null;
  plano: Plano | null;
}) {
  const status = pagamento?.status ?? ticket.status;
  const valor = pagamento?.valorCobrado ?? ticket.valorAtual;
  const validade = pagamento?.janelaSaidaExpiraEm ?? ticket.janelaSaidaExpiraEm;
  const codigos = pagamento ? codigosDoPagamento(pagamento) : { qrCode: null, codigo: null };
  const copiavel = codigoCopiavel(codigos);
  const [copiado, setCopiado] = useState(false);

  if (!pagamentoConfirmado(status)) return null;

  async function copiar() {
    if (!copiavel) return;
    try {
      await navigator.clipboard.writeText(copiavel);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <section className="comprovante" aria-labelledby="titulo-comprovante">
      <h2 id="titulo-comprovante">Comprovante</h2>
      <dl className="lista-dados">
        <div>
          <dt>Identificador</dt>
          <dd>{identificador}</dd>
        </div>
        <div>
          <dt>Placa</dt>
          <dd>{ticket.placa}</dd>
        </div>
        <div>
          <dt>Plano</dt>
          <dd>{plano?.nome ?? '—'}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span className="status-pill">{status}</span>
          </dd>
        </div>
        <div>
          <dt>Valor</dt>
          <dd>{formatarMoeda(valor)}</dd>
        </div>
        <div>
          <dt>Validade</dt>
          <dd>{plano?.validade ?? '—'}</dd>
        </div>
        <div>
          <dt>Janela de saída</dt>
          <dd>{formatarData(validade)}</dd>
        </div>
      </dl>
      {codigos.qrCode && qrEhImagem(codigos.qrCode) ? (
        <img className="comprovante-qr" src={codigos.qrCode} alt="QR Code do pagamento" />
      ) : null}
      {copiavel ? (
        <div className="comprovante-codigo">
          <p>
            Código: <span>{copiavel}</span>
          </p>
          <button type="button" onClick={() => void copiar()}>
            Copiar código
          </button>
          {copiado ? <p role="status">Código copiado.</p> : null}
        </div>
      ) : null}
    </section>
  );
}

export function BotaoPagamento({ confirmado }: { confirmado: boolean }) {
  const { navegar } = useNavegacao();
  if (!confirmado) return null;
  return (
    <button type="button" onClick={() => navegar('/cliente/pagamento')}>
      Ir para pagamento
    </button>
  );
}
