import type { ApiCliente } from '../api/cliente.ts';
import { ErroApi } from '../api/erro-api.ts';
import type { MultaPaga, Ticket } from '../api/tipos.ts';
import { pagamentoConfirmado } from './pagamento.ts';

export function cobrancaIndicada(ticket: { status: string; valorMulta: number | null }): boolean {
  return ticket.status === 'multa_pendente' && valorInformado(ticket.valorMulta);
}

export function cobrancaQuitada(ticket: { status: string; valorMulta: number | null }): boolean {
  return pagamentoConfirmado(ticket.status) && valorInformado(ticket.valorMulta);
}

export interface ComprovanteMultaDados {
  identificador: string;
  placa: string;
  valor: number;
  status: string;
  pagoEm: string | null;
  janelaSaidaExpiraEm: string | null;
}

export function comprovanteDaConsulta(ticket: Ticket, identificador: string): ComprovanteMultaDados | null {
  if (!cobrancaQuitada(ticket) || ticket.valorMulta === null) return null;
  return {
    identificador,
    placa: ticket.placa,
    valor: ticket.valorMulta,
    status: ticket.status,
    pagoEm: null,
    janelaSaidaExpiraEm: ticket.janelaSaidaExpiraEm,
  };
}

export function comprovanteDaResposta(
  ticket: Ticket,
  multa: MultaPaga,
  identificador: string,
): ComprovanteMultaDados | null {
  if (!pagamentoConfirmado(multa.status) || !valorInformado(multa.valorMulta)) return null;
  return {
    identificador,
    placa: ticket.placa,
    valor: multa.valorMulta,
    status: multa.status,
    pagoEm: multa.pagoEm,
    janelaSaidaExpiraEm: multa.janelaSaidaExpiraEm,
  };
}

export type ResultadoMulta =
  | { tipo: 'confirmada'; ticket: Ticket; multa: MultaPaga }
  | { tipo: 'ausente'; ticket: Ticket };

export async function pagarMultaUmaVez(api: Pick<ApiCliente, 'obterTicket' | 'pagarMulta'>): Promise<ResultadoMulta> {
  const atual = await api.obterTicket();
  if (!cobrancaIndicada(atual)) return { tipo: 'ausente', ticket: atual };

  try {
    const multa = await api.pagarMulta();
    if (!pagamentoConfirmado(multa.status) || !valorInformado(multa.valorMulta)) {
      throw new ErroApi(202, 'PAGAMENTO_EM_ANALISE', 'A cobrança adicional está em análise e não foi confirmada.');
    }
    return { tipo: 'confirmada', ticket: atual, multa };
  } catch (erro) {
    if (erro instanceof ErroApi && erro.codigo === 'MULTA_NAO_PENDENTE') {
      const deNovo = await api.obterTicket();
      if (!cobrancaIndicada(deNovo)) return { tipo: 'ausente', ticket: deNovo };
    }
    throw erro;
  }
}

function valorInformado(valor: number | null): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor);
}
