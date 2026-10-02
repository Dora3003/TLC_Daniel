import type { ApiCliente } from '../api/cliente.ts';
import { useConsulta } from '../hooks/useConsulta.ts';
import { useMutacao } from '../hooks/useMutacao.ts';
import type { ComprovanteMultaDados } from './multa.ts';
import { cobrancaIndicada, comprovanteDaConsulta, comprovanteDaResposta, pagarMultaUmaVez } from './multa.ts';

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatarData(valor: string | null): string {
  if (!valor) return '—';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString('pt-BR');
}

export function PaginaMulta({
  api,
  token,
  embutida = false,
}: {
  api: ApiCliente;
  token: string;
  embutida?: boolean;
}) {
  const ticket = useConsulta('multa', () => api.obterTicket());
  const pagamento = useMutacao(() => pagarMultaUmaVez(api));
  const confirmada =
    pagamento.estado.tipo === 'ready' && pagamento.estado.dados.tipo === 'confirmada'
      ? comprovanteDaResposta(pagamento.estado.dados.ticket, pagamento.estado.dados.multa, token)
      : null;
  const ticketExibido =
    pagamento.estado.tipo === 'ready' && pagamento.estado.dados.tipo === 'ausente'
      ? pagamento.estado.dados.ticket
      : ticket.estado.tipo === 'ready'
        ? ticket.estado.dados
        : null;
  const daConsulta = confirmada || !ticketExibido ? null : comprovanteDaConsulta(ticketExibido, token);
  const comprovante = confirmada ?? daConsulta;
  const pendente = ticketExibido !== null && cobrancaIndicada(ticketExibido) && comprovante === null;
  const ocupado = pagamento.estado.tipo === 'submitting';

  return (
    <section className={embutida ? undefined : 'pagina'}>
      {embutida ? null : <h1>Cobrança adicional</h1>}
      {ticket.estado.tipo === 'loading' && !embutida ? <p role="status">Consultando a cobrança…</p> : null}
      {ticket.estado.tipo === 'error' && !embutida ? (
        <>
          <p role="alert">{ticket.estado.mensagem}</p>
          <button type="button" onClick={ticket.recarregar}>
            Tentar novamente
          </button>
        </>
      ) : null}
      {ocupado ? <p role="status">Processando pagamento…</p> : null}
      {ticketExibido && !pendente && comprovante === null && !embutida ? (
        <p>Não há cobrança adicional para este ticket.</p>
      ) : null}
      {pendente && ticketExibido && typeof ticketExibido.valorMulta === 'number' ? (
        <section className="comprovante">
          <h2>Cobrança adicional</h2>
          <dl className="lista-dados">
            <div>
              <dt>Placa</dt>
              <dd>{ticketExibido.placa}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className="status-pill">{ticketExibido.status}</span>
              </dd>
            </div>
            <div>
              <dt>Valor da cobrança</dt>
              <dd>{formatarMoeda(ticketExibido.valorMulta)}</dd>
            </div>
          </dl>
          <button type="button" onClick={() => void pagamento.enviar()} disabled={ocupado}>
            Gerar QR Code Multa
          </button>
        </section>
      ) : null}
      {pagamento.estado.tipo === 'error' ? <p role="alert">{pagamento.estado.mensagem}</p> : null}
      {comprovante ? <ReciboMulta dados={comprovante} /> : null}
    </section>
  );
}

function ReciboMulta({ dados }: { dados: ComprovanteMultaDados }) {
  return (
    <section className="comprovante" aria-labelledby="titulo-comprovante-multa">
      <h2 id="titulo-comprovante-multa">Comprovante da cobrança adicional</h2>
      <dl className="lista-dados">
        <div>
          <dt>Identificador</dt>
          <dd>{dados.identificador}</dd>
        </div>
        <div>
          <dt>Placa</dt>
          <dd>{dados.placa}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span className="status-pill">{dados.status}</span>
          </dd>
        </div>
        <div>
          <dt>Valor</dt>
          <dd>{formatarMoeda(dados.valor)}</dd>
        </div>
        <div>
          <dt>Pago em</dt>
          <dd>{formatarData(dados.pagoEm)}</dd>
        </div>
        <div>
          <dt>Janela de saída</dt>
          <dd>{formatarData(dados.janelaSaidaExpiraEm)}</dd>
        </div>
      </dl>
    </section>
  );
}