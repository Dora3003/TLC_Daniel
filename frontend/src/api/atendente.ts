import type { Http } from './http.ts';
import type { Ativo, EntradaRequest, EntradaResponse, HistoricoItem, Ocupacao } from './tipos.ts';

export interface ApiAtendente {
  registrarEntrada(dados: EntradaRequest): Promise<EntradaResponse>;
  obterOcupacao(): Promise<Ocupacao>;
  listarAtivos(): Promise<Ativo[]>;
  historico(placa: string): Promise<HistoricoItem[]>;
}

export function criarApiAtendente(http: Http): ApiAtendente {
  return {
    registrarEntrada: (dados) => http.post<EntradaResponse>('/api/entrada', dados),
    obterOcupacao: () => http.get<Ocupacao>('/api/ocupacao'),
    listarAtivos: () => http.get<Ativo[]>('/api/ativos'),
    historico: (placa) => http.get<HistoricoItem[]>(`/api/historico/${encodeURIComponent(placa)}`),
  };
}
