import type { FormEvent } from 'react';
import { useState } from 'react';
import type { ApiAtendente } from '../api/atendente.ts';
import { useMutacao } from '../hooks/useMutacao.ts';
import { confirmacaoDaSaida } from './saida.ts';

function formatarData(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString('pt-BR');
}

export function PaginaSaidaVeiculo({
  api,
  embutida = false,
  aoSucesso,
}: {
  api: ApiAtendente;
  embutida?: boolean;
  aoSucesso?: () => void;
}) {
  const [token, setToken] = useState('');
  const saida = useMutacao(async () => {
    const dados = await api.registrarSaida(token.trim().toUpperCase());
    aoSucesso?.();
    return dados;
  });
  const ocupado = saida.estado.tipo === 'submitting';
  const confirmacao = saida.estado.tipo === 'ready' ? confirmacaoDaSaida(saida.estado.dados) : null;

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado || token.trim() === '') return;
    void saida.enviar();
  }

  const conteudo = (
    <>
      {!embutida ? (
        <div className="cartao-cabecalho">
          <h2>Saída de Veículo</h2>
        </div>
      ) : null}
      <form className="formulario-cadastro" onSubmit={aoEnviar}>
        <label>
          Token do ticket
          <input
            value={token}
            onChange={(evento) => setToken(evento.target.value)}
            placeholder="Digite o token de 7 caracteres"
            required
            autoComplete="off"
            maxLength={7}
            disabled={ocupado}
          />
        </label>
        <button type="submit" disabled={ocupado || token.trim() === ''}>
          {ocupado ? 'Registrando saída…' : 'Registrar Saída'}
        </button>
      </form>
      {saida.estado.tipo === 'error' ? <p role="alert">{saida.estado.mensagem}</p> : null}
      {saida.estado.tipo === 'ready' && confirmacao === null ? (
        <p role="alert">A saída não foi confirmada pela API.</p>
      ) : null}
      {confirmacao ? (
        <section className="confirmacao-entrada" aria-labelledby="titulo-saida">
          <h3 id="titulo-saida">Saída registrada</h3>
          <p>
            <span>Placa</span>
            <strong>{confirmacao.placa}</strong>
          </p>
          <p>
            <span>Horário saída</span>
            <strong>{formatarData(confirmacao.saidaEm)}</strong>
          </p>
          <p>
            <span>Status</span>
            <strong>{confirmacao.status}</strong>
          </p>
        </section>
      ) : null}
    </>
  );

  if (embutida) return <div className="operacao-conteudo">{conteudo}</div>;
  return <section className="pagina">{conteudo}</section>;
}
