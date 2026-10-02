import type { ApiCliente } from '../api/cliente.ts';
import { ErroApi } from '../api/erro-api.ts';
import type { Pagamento, Ticket } from '../api/tipos.ts';

export function pagamentoConfirmado(status: string | null | undefined): boolean {
  return status === 'pago';
}

export function podeIniciarPagamento(statusTicket: string): boolean {
  return statusTicket === 'ativo';
}

export interface CodigoCheckout {
  qrCode: string | null;
  codigo: string | null;
}

export function codigosDoPagamento(pagamento: { qrCode?: unknown; codigo?: unknown }): CodigoCheckout {
  return {
    qrCode: textoUtil(pagamento.qrCode),
    codigo: textoUtil(pagamento.codigo),
  };
}

function textoUtil(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const texto = valor.trim();
  return texto === '' ? null : texto;
}

export function codigoCopiavel(codigo: CodigoCheckout): string | null {
  return codigo.codigo ?? codigo.qrCode;
}

export function qrEhImagem(qrCode: string): boolean {
  return qrCode.startsWith('data:image/') || qrCode.startsWith('https://') || qrCode.startsWith('http://');
}

/** URL aberta pelo QR: ao carregar, a página dispara o pagamento do ticket. */
export function urlConfirmacaoPagamento(origem: string, token: string): string {
  const base = origem.replace(/\/$/, '');
  return `${base}/pagar?token=${encodeURIComponent(token.trim().toUpperCase())}`;
}

export function urlConfirmacaoMulta(origem: string, token: string): string {
  const base = origem.replace(/\/$/, '');
  return `${base}/pagar-multa?token=${encodeURIComponent(token.trim().toUpperCase())}`;
}

/** Imagem de QR apontando para a URL de confirmação (serviço público de geração). */
export function imagemQrDaUrl(url: string, tamanho = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${tamanho}x${tamanho}&data=${encodeURIComponent(url)}`;
}

export async function pagarUmaVez(api: Pick<ApiCliente, 'obterTicket' | 'pagarEstadia'>): Promise<{
  ticket: Ticket;
  pagamento: Pagamento | null;
}> {
  const atual = await api.obterTicket();
  if (pagamentoConfirmado(atual.status)) return { ticket: atual, pagamento: null };
  if (!podeIniciarPagamento(atual.status)) {
    throw new ErroApi(409, 'PAGAMENTO_INDISPONIVEL', 'Não foi possível iniciar o pagamento deste ticket.');
  }

  try {
    const resposta = await api.pagarEstadia();
    if (!pagamentoConfirmado(resposta.status)) {
      throw new ErroApi(202, 'PAGAMENTO_EM_ANALISE', 'O pagamento está em análise. A contratação não foi confirmada.');
    }
    return { ticket: atual, pagamento: resposta };
  } catch (erro) {
    if (erro instanceof ErroApi && erro.codigo === 'PAGAMENTO_JA_REALIZADO') {
      const deNovo = await api.obterTicket();
      if (pagamentoConfirmado(deNovo.status)) return { ticket: deNovo, pagamento: null };
    }
    throw erro;
  }
}