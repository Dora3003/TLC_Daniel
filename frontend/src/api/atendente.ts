import type { Http } from './http.ts';
import type {
  Ativo,
  EntradaRequest,
  EntradaResponse,
  HistoricoItem,
  Ocupacao,
  SaidaResponse,
} from './tipos.ts';
import { CAPACIDADE_PATIO, calcularDisponiveis } from '../atendimento/capacidade.ts';

export interface ApiAtendente {
  registrarEntrada(dados: EntradaRequest): Promise<EntradaResponse>;
  registrarSaida(token: string): Promise<SaidaResponse>;
  obterOcupacao(): Promise<Ocupacao>;
  listarAtivos(): Promise<Ativo[]>;
  historico(placa: string): Promise<HistoricoItem[]>;
}

export function criarApiAtendente(http: Http): ApiAtendente {
  return {
    registrarEntrada: (dados) => http.post<EntradaResponse>('/api/entrada', dados),
    registrarSaida: (token) => http.post<SaidaResponse>('/api/saida', { token }),
    obterOcupacao: async () => {
      const ativos = await http.get<Ativo[]>('/api/ativos');
      const ocupadas = ativos.length;
      return {
        ocupadas,
        capacidade: CAPACIDADE_PATIO,
        disponiveis: calcularDisponiveis(ocupadas),
      } satisfies Ocupacao;
    },
    listarAtivos: () => http.get<Ativo[]>('/api/ativos'),
    historico: (placa) => http.get<HistoricoItem[]>(`/api/historico/${encodeURIComponent(placa)}`),
  };
}
