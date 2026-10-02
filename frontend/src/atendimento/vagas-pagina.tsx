import type { ApiAtendente } from '../api/atendente.ts';
import { useConsulta } from '../hooks/useConsulta.ts';
import { indicadoresOficiais, textoIndicador } from './vagas.ts';

export function PaginaVagas({ api, cartao = false }: { api: ApiAtendente; cartao?: boolean }) {
  const { estado, recarregar } = useConsulta('ocupacao', () => api.obterOcupacao());
  const indicadores = estado.tipo === 'ready' ? indicadoresOficiais(estado.dados) : null;

  return (
    <section className={cartao ? 'cartao vagas' : 'pagina'}>
      <h2>Vagas</h2>
      {estado.tipo === 'loading' ? <p role="status">Carregando vagas…</p> : null}
      {estado.tipo === 'error' ? (
        <>
          <p role="alert">{estado.mensagem}</p>
          <button type="button" onClick={recarregar}>
            Tentar novamente
          </button>
        </>
      ) : null}
      {indicadores ? (
        <div className="numeros">
          <p>
            <strong>{textoIndicador(indicadores.ocupadas)}</strong>
            <span>Ocupadas</span>
          </p>
          <p>
            <strong>{textoIndicador(indicadores.disponiveis)}</strong>
            <span>Disponíveis</span>
          </p>
        </div>
      ) : null}
      {estado.tipo === 'ready' ? (
        <button type="button" onClick={recarregar}>
          Atualizar
        </button>
      ) : null}
    </section>
  );
}
