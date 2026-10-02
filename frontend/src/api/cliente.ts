import { ErroApi } from './erro-api.ts';
import type { Http } from './http.ts';
import type { MultaPaga, Pagamento, Plano, Ticket } from './tipos.ts';
import type { Sessao } from '../auth/sessao.ts';
import { normalizarToken, tokenValido } from '../auth/token.ts';
import { catalogoTarifaOficial, planoPorId } from '../planos/tabela-valores.ts';

export interface ApiCliente {
  obterTicket(): Promise<Ticket>;
  listarPlanos(): Promise<Plano[]>;
  obterPlano(id: string): Promise<Plano>;
  pagarEstadia(): Promise<Pagamento>;
  pagarMulta(): Promise<MultaPaga>;
}

export function criarApiCliente(http: Http, sessao: Extract<Sessao, { papel: 'cliente' }>): ApiCliente {
  const token = normalizarToken(sessao.token);
  if (!tokenValido(token)) {
    throw new ErroApi(400, 'TOKEN_INVALIDO', 'O token do ticket é inválido.');
  }
  const caminho = `/api/tickets/${encodeURIComponent(token)}`;

  return {
    obterTicket: () => http.get<Ticket>(caminho),
    // A API real não expõe /api/planos (DEC-03). A tabela usa a tarifa oficial AD-004.
    listarPlanos: async () => catalogoTarifaOficial(),
    obterPlano: async (id) => {
      const plano = planoPorId(id);
      if (!plano) {
        throw new ErroApi(404, 'PLANO_NAO_ENCONTRADO', 'Plano não encontrado.');
      }
      return plano;
    },
    pagarEstadia: () => http.post<Pagamento>(`${caminho}/pagamentos`),
    pagarMulta: () => http.post<MultaPaga>(`${caminho}/multas`),
  };
}
