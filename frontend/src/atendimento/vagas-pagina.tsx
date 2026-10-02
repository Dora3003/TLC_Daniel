import type { ApiAtendente } from '../api/atendente.ts';
import { useConsulta } from '../hooks/useConsulta.ts';
import { indicadoresOficiais, textoIndicador } from './vagas.ts';

export function PaginaVagas({
  api,
  cartao = false,
  versao = 0,
}: {
  api: ApiAtendente;
  cartao?: boolean;
  versao?: number;
}) {
  const { estado, recarregar } = useConsulta(`ocupacao:${versao}`, () => api.obterOcupacao());
  const indicadores = estado.tipo === 'ready' ? indicadoresOficiais(estado.dados) : null;

  return (
    <section className={cartao ? 'cartao vagas' : 'pagina'}>
      <div className="cartao-cabecalho">
        <h2>Vagas</h2>
        {estado.tipo === 'ready' ? (
          <button type="button" className="botao-secundario" onClick={recarregar}>
            Atualizar
          </button>
        ) : null}
      </div>

      {estado.tipo === 'loading' ? <p role="status">Carregando vagas…</p> : null}
      {estado.tipo === 'error' ? (
        <div className="cartao-feedback">
          <p role="alert">{estado.mensagem}</p>
          <button type="button" onClick={recarregar}>
            Tentar novamente
          </button>
        </div>
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
    </section>
  );
}
