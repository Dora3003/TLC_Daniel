import { useMemo, useState } from 'react';
import type { ApiCliente } from '../api/cliente.ts';
import type { Pagamento, Plano, Ticket } from '../api/tipos.ts';
import { useConsulta } from '../hooks/useConsulta.ts';
import { useNavegacao } from '../rotas/contexto-navegacao.ts';
import {
  codigoCopiavel,
  codigosDoPagamento,
  imagemQrDaUrl,
  pagamentoConfirmado,
  podeIniciarPagamento,
  qrEhImagem,
  urlConfirmacaoPagamento,
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
  const [qrVisivel, setQrVisivel] = useState(false);

  const jaPago = ticket.estado.tipo === 'ready' && pagamentoConfirmado(ticket.estado.dados.status);
  const podeGerar =
    ticket.estado.tipo === 'ready' && podeIniciarPagamento(ticket.estado.dados.status) && !jaPago;

  const linkPagamento = useMemo(
    () => urlConfirmacaoPagamento(typeof window !== 'undefined' ? window.location.origin : '', token),
    [token],
  );
  const imagemQr = useMemo(() => imagemQrDaUrl(linkPagamento), [linkPagamento]);

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

        {podeGerar ? (
          <>
            <button type="button" onClick={() => setQrVisivel(true)}>
              Gerar QR Code
            </button>
            <p className="dica">Escaneie o QR para abrir a página que confirma o pagamento do ticket.</p>
          </>
        ) : null}

        {qrVisivel && podeGerar ? (
          <section className="comprovante qr-painel" aria-labelledby="titulo-qr">
            <h2 id="titulo-qr">QR Code de pagamento</h2>
            <img className="comprovante-qr" src={imagemQr} alt="QR Code para confirmar o pagamento" />
            <p className="dica">Ao escanear, o site registra o pagamento deste ticket.</p>
            <p className="link-pagamento">
              <a href={linkPagamento} target="_blank" rel="noreferrer">
                Abrir link de confirmação
              </a>
            </p>
            <button type="button" className="botao-secundario botao-largo" onClick={ticket.recarregar}>
              Já paguei — atualizar status
            </button>
          </section>
        ) : null}
      </div>

      {jaPago && ticket.estado.tipo === 'ready' ? (
        <Comprovante
          identificador={token}
          ticket={ticket.estado.dados}
          pagamento={null}
          plano={plano.estado.tipo === 'ready' ? plano.estado.dados : null}
        />
      ) : null}

      <p className="dica dica-saida">
        Você tem até 10 minutos para realizar a saída. Depois desse prazo, pode haver cobrança adicional.
      </p>
    </section>
  );
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
