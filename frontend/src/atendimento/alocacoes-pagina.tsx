import type { ApiAtendente } from '../api/atendente.ts';
import { useConsulta } from '../hooks/useConsulta.ts';
import { linhasAlocacao } from './alocacoes.ts';

function formatarData(valor: string | null): string {
  if (!valor) return '—';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString('pt-BR');
}

function listaVazia(itens: readonly unknown[]): boolean {
  return itens.length === 0;
}

export function PaginaVeiculos({ api, cartao = false }: { api: ApiAtendente; cartao?: boolean }) {
  const { estado, recarregar } = useConsulta('alocacoes', () => api.listarAtivos(), listaVazia);
  const linhas = estado.tipo === 'ready' ? linhasAlocacao(estado.dados) : [];

  return (
    <section className={cartao ? 'cartao lista' : 'pagina'}>
      <h2>Veículos Alocados</h2>
      {estado.tipo === 'loading' ? <p role="status">Carregando veículos…</p> : null}
      {estado.tipo === 'error' ? (
        <>
          <p role="alert">{estado.mensagem}</p>
          <button type="button" onClick={recarregar}>
            Tentar novamente
          </button>
        </>
      ) : null}
      {estado.tipo === 'empty' ? <p>Não há veículos no pátio.</p> : null}
      {estado.tipo === 'ready' ? (
        <div className="tabela-rolagem">
          <table>
            <caption>Veículos no pátio</caption>
            <thead>
              <tr>
                <th scope="col">Identificador</th>
                <th scope="col">Placa</th>
                <th scope="col">Data de Alocação</th>
              </tr>
            </thead>
          <tbody>
            {linhas.map((linha, indice) => (
              <tr key={linha.id ?? `sem-id-${indice}`}>
                <td>{linha.id ?? '—'}</td>
                <td>{linha.placa ?? '—'}</td>
                <td>{formatarData(linha.entradaEm)}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      ) : null}
      {estado.tipo === 'ready' || estado.tipo === 'empty' ? (
        <button type="button" onClick={recarregar}>
          Atualizar
        </button>
      ) : null}
    </section>
  );
}
