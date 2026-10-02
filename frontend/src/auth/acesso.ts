import type { Sessao } from './sessao.ts';
import { normalizarToken, tokenValido } from './token.ts';

export type MotivoNegacao =
  | 'token_ausente'
  | 'token_invalido'
  | 'cliente_sem_acesso_operacional'
  | 'atendente_sem_acesso_pagamento'
  | 'login_obrigatorio'
  | 'rota_inexistente';

export interface DecisaoAcesso {
  permitido: boolean;
  destino: string;
  sessao: Sessao;
  motivo?: MotivoNegacao;
}

export const MENSAGENS_ACESSO: Record<MotivoNegacao, string> = {
  token_ausente: 'Informe o token do ticket para acessar sua estadia.',
  token_invalido: 'O token do ticket é inválido.',
  cliente_sem_acesso_operacional: 'O acesso do cliente não inclui o painel operacional.',
  atendente_sem_acesso_pagamento: 'O painel do atendente não acessa o pagamento de um ticket.',
  login_obrigatorio: 'Entre com e-mail e senha para acessar o painel.',
  rota_inexistente: 'Não encontramos esta página.',
};

const INICIO_CLIENTE = '/cliente/planos';

type Area = 'publica' | 'cliente' | 'atendente' | 'desconhecida';

function normalizarCaminho(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname || '/';
}

function areaDoCaminho(caminho: string): Area {
  if (caminho === '/' || caminho === '/pagar' || caminho === '/pagar-multa') return 'publica';
  if (caminho === '/cliente' || caminho === '/cliente/planos' || caminho === '/cliente/revisao' || caminho === '/cliente/pagamento' || caminho === '/cliente/comprovante' || caminho === '/cliente/contratacoes' || caminho === '/cliente/multa') {
    return 'cliente';
  }
  if (
    caminho === '/atendimento' ||
    caminho === '/atendimento/entrada' ||
    caminho === '/atendimento/veiculos'
  ) {
    return 'atendente';
  }
  return 'desconhecida';
}

function negar(destino: string, sessao: Sessao, motivo: MotivoNegacao): DecisaoAcesso {
  return { permitido: false, destino, sessao, motivo };
}

function permitir(destino: string, sessao: Sessao): DecisaoAcesso {
  return { permitido: true, destino, sessao };
}

export function decidirAcesso(pathname: string, search: string, sessao: Sessao): DecisaoAcesso {
  const caminho = normalizarCaminho(pathname);
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const tokenBruto = params.get('token');
  const area = areaDoCaminho(caminho);

  if (tokenBruto !== null) {
    const token = normalizarToken(tokenBruto);
    if (!tokenValido(token)) return negar('/', null, 'token_invalido');
    const sessaoCliente: Sessao = { papel: 'cliente', token };
    if (caminho === '/pagar' || caminho === '/pagar-multa') return permitir(caminho, sessaoCliente);
    if (area === 'atendente') return negar(INICIO_CLIENTE, sessaoCliente, 'cliente_sem_acesso_operacional');
    if (area === 'cliente') return permitir(caminho, sessaoCliente);
    if (area === 'desconhecida') return negar(INICIO_CLIENTE, sessaoCliente, 'rota_inexistente');
    return permitir(INICIO_CLIENTE, sessaoCliente);
  }

  if (caminho === '/pagar' || caminho === '/pagar-multa') {
    return negar('/', null, 'token_ausente');
  }

  if (sessao?.papel === 'cliente') {
    if (area === 'atendente') return negar(INICIO_CLIENTE, sessao, 'cliente_sem_acesso_operacional');
    if (area === 'cliente') return permitir(caminho, sessao);
    if (area === 'publica') return permitir(INICIO_CLIENTE, sessao);
    return negar(INICIO_CLIENTE, sessao, 'rota_inexistente');
  }

  if (sessao?.papel === 'atendente') {
    if (area === 'cliente') return negar('/atendimento', sessao, 'atendente_sem_acesso_pagamento');
    if (area === 'atendente') return permitir(caminho, sessao);
    if (area === 'publica') return permitir('/atendimento', sessao);
    return negar('/atendimento', sessao, 'rota_inexistente');
  }

  if (area === 'cliente') return negar('/', null, 'token_ausente');
  if (area === 'atendente') return negar('/atendimento', null, 'login_obrigatorio');
  if (area === 'publica') return permitir('/', null);
  return negar('/', null, 'rota_inexistente');
}
