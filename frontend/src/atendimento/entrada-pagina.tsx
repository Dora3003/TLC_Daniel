import type { FormEvent } from 'react';
import { useState } from 'react';
import type { ApiAtendente } from '../api/atendente.ts';
import { useConsulta } from '../hooks/useConsulta.ts';
import { useMutacao } from '../hooks/useMutacao.ts';
import { indicadoresOficiais } from './vagas.ts';
import { confirmacaoDaEntrada, MENSAGEM_LOTACAO, patioLotado } from './entrada.ts';

function formatarData(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString('pt-BR');
}

export function PaginaEntradaVeiculo({ api, cartao = false }: { api: ApiAtendente; cartao?: boolean }) {
  const ocupacao = useConsulta('entrada-ocupacao', () => api.obterOcupacao());
  const [placa, setPlaca] = useState('');
  const [motoristaNome, setMotoristaNome] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const entrada = useMutacao(() =>
    api.registrarEntrada({
      placa,
      motoristaNome,
      ...(modelo.trim() ? { modelo } : {}),
      ...(cor.trim() ? { cor } : {}),
    }),
  );
  const indicadores = ocupacao.estado.tipo === 'ready' ? indicadoresOficiais(ocupacao.estado.dados) : null;
  const lotado = indicadores !== null && patioLotado(indicadores.disponiveis);
  const ocupado = entrada.estado.tipo === 'submitting';
  const consultando = ocupacao.estado.tipo === 'loading';
  const podeEnviar = !lotado && !ocupado && !consultando;
  const confirmacao = entrada.estado.tipo === 'ready' ? confirmacaoDaEntrada(entrada.estado.dados) : null;

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!podeEnviar) return;
    void entrada.enviar();
  }

  return (
    <section className={cartao ? 'cartao' : 'pagina'}>
      <h2>{cartao ? 'Cadastrar Veículo' : 'Registrar entrada'}</h2>
      {consultando ? <p role="status">Consultando vagas…</p> : null}
      {ocupacao.estado.tipo === 'error' ? (
        <>
          <p role="alert">{ocupacao.estado.mensagem}</p>
          <button type="button" onClick={ocupacao.recarregar}>
            Tentar novamente
          </button>
        </>
      ) : null}
      {lotado ? (
        <p id="aviso-lotacao" role="alert">
          {MENSAGEM_LOTACAO}
        </p>
      ) : null}
      <form onSubmit={aoEnviar}>
          <label>
            Placa
            <input
              value={placa}
              onChange={(evento) => setPlaca(evento.target.value)}
              placeholder="Digite a placa do veículo"
              required
              autoComplete="off"
              disabled={!podeEnviar}
            />
          </label>
          <label>
            Nome do motorista
            <input
              value={motoristaNome}
              onChange={(evento) => setMotoristaNome(evento.target.value)}
              required
              autoComplete="name"
              disabled={!podeEnviar}
            />
          </label>
          <label>
            Modelo
            <input
              value={modelo}
              onChange={(evento) => setModelo(evento.target.value)}
              autoComplete="off"
              disabled={!podeEnviar}
            />
          </label>
          <label>
            Cor
            <input value={cor} onChange={(evento) => setCor(evento.target.value)} autoComplete="off" disabled={!podeEnviar} />
          </label>
          <button type="submit" disabled={!podeEnviar} aria-describedby={lotado ? 'aviso-lotacao' : undefined}>
            {ocupado ? 'Registrando entrada…' : 'Cadastrar Veículo'}
          </button>
        </form>
      {entrada.estado.tipo === 'error' ? <p role="alert">{entrada.estado.mensagem}</p> : null}
      {entrada.estado.tipo === 'ready' && confirmacao === null ? (
        <p role="alert">A entrada não foi confirmada pela API.</p>
      ) : null}
      {confirmacao ? (
        <section aria-labelledby="titulo-entrada">
          <h3 id="titulo-entrada">Entrada registrada</h3>
          <p>Placa: {confirmacao.placa}</p>
          <p>Horário entrada: {formatarData(confirmacao.entradaEm)}</p>
        </section>
      ) : null}
    </section>
  );
}
