export type StatusNoPatio = 'ativo' | 'pago' | 'multa_pendente';
export type StatusRegistro = StatusNoPatio | 'finalizado';

export interface Plano {
  id: string;
  nome: string;
  tipo: '1h' | '5h' | 'diaria' | 'mensal';
  preco: number;
  moeda: 'BRL';
  validade: string;
  disponivel: boolean;
  regras: string;
}

export interface EntradaRequest {
  placa: string;
  motoristaNome: string;
  modelo?: string;
  cor?: string;
}

export interface EntradaResponse {
  id: string;
  placa: string;
  motoristaNome: string;
  modelo: string | null;
  cor: string | null;
  token: string;
  loginUrl: string;
  entradaEm: string;
  status: 'ativo';
}

export interface Ticket {
  placa: string;
  motoristaNome: string;
  entradaEm: string;
  status: StatusNoPatio;
  duracaoMinutos: number;
  valorAtual: number;
  valorMulta: number | null;
  janelaSaidaExpiraEm: string | null;
}

export interface Pagamento {
  valorCobrado: number;
  pagoEm: string;
  status: string;
  janelaSaidaExpiraEm: string;
  qrCode?: string;
  codigo?: string;
}

export interface MultaPaga {
  valorMulta: number;
  pagoEm: string;
  status: string;
  janelaSaidaExpiraEm: string;
}

export interface Ocupacao {
  ocupadas: number;
  capacidade: number | null;
  disponiveis: number | null;
}

export interface Ativo {
  id: string;
  placa: string;
  motoristaNome: string;
  token: string;
  entradaEm: string;
  status: StatusNoPatio;
  tempoDecorridoMinutos: number;
}

export interface HistoricoItem {
  id: string;
  placa: string;
  entradaEm: string;
  saidaEm: string | null;
  valorCobrado: number | null;
  status: StatusRegistro;
}

export interface SaidaResponse {
  id: string;
  placa: string;
  entradaEm: string;
  saidaEm: string;
  duracaoMinutos: number;
  valorCobrado: number | null;
  status: 'finalizado';
}
