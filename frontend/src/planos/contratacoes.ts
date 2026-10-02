import type { Ticket } from '../api/tipos.ts';
import { pagamentoConfirmado } from './pagamento.ts';

export interface ItemContratacao {
  identificador: string;
  placa: string;
  status: string;
  valor: number;
  validade: string | null;
}

export function contratacoesConfirmadas(ticket: Ticket, identificador: string): ItemContratacao[] {
  if (!pagamentoConfirmado(ticket.status)) return [];
  return [
    {
      identificador,
      placa: ticket.placa,
      status: ticket.status,
      valor: ticket.valorAtual,
      validade: ticket.janelaSaidaExpiraEm,
    },
  ];
}
