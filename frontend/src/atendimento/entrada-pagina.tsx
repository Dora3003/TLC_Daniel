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

export function PaginaEntradaVeiculo({
  api,
  cartao = false,
  embutida = false,
  aoSucesso,
}: {
  api: ApiAtendente;
  cartao?: boolean;
  embutida?: boolean;
  aoSucesso?: () => void;
}) {
  const ocupacao = useConsulta('entrada-ocupacao', () => api.obterOcupacao());
  const [placa, setPlaca] = useState('');
  const [motoristaNome, setMotoristaNome] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const entrada = useMutacao(async () => {
    const dados = await api.registrarEntrada({
      placa,
      motoristaNome,
      ...(modelo.trim() ? { modelo } : {}),
      ...(cor.trim() ? { cor } : {}),
    });
    ocupacao.recarregar();
    aoSucesso?.();
    return dados;
  });
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

  const conteudo = (
    <>
      {!embutida ? (
        <div className="cartao-cabecalho">
          <h2>{cartao ? 'Cadastrar Veículo' : 'Registrar entrada'}</h2>
        </div>
      ) : null}
      {consultando ? <p role="status">Consultando vagas…</p> : null}
      {ocupacao.estado.tipo === 'error' ? (
        <div className="cartao-feedback">
          <p role="alert">{ocupacao.estado.mensagem}</p>
          <button type="button" onClick={ocupacao.recarregar}>
            Tentar novamente
          </button>
        </div>
      ) : null}
      {lotado ? (
        <p id="aviso-lotacao" role="alert">
          {MENSAGEM_LOTACAO}
        </p>
      ) : null}
      <form className="formulario-cadastro" onSubmit={aoEnviar}>
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
        <div className="campos-duplos">
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
            <input
              value={cor}
              onChange={(evento) => setCor(evento.target.value)}
              autoComplete="off"
              disabled={!podeEnviar}
            />
          </label>
        </div>
        <button type="submit" disabled={!podeEnviar} aria-describedby={lotado ? 'aviso-lotacao' : undefined}>
          {ocupado ? 'Registrando entrada…' : 'Cadastrar Veículo'}
        </button>
      </form>
      {entrada.estado.tipo === 'error' ? <p role="alert">{entrada.estado.mensagem}</p> : null}
      {entrada.estado.tipo === 'ready' && confirmacao === null ? (
        <p role="alert">A entrada não foi confirmada pela API.</p>
      ) : null}
      {confirmacao ? (
        <section className="confirmacao-entrada" aria-labelledby="titulo-entrada">
          <h3 id="titulo-entrada">Entrada registrada</h3>
          <p>
            <span>Placa</span>
            <strong>{confirmacao.placa}</strong>
          </p>
          <p>
            <span>Horário entrada</span>
            <strong>{formatarData(confirmacao.entradaEm)}</strong>
          </p>
        </section>
      ) : null}
    </>
  );

  if (embutida) return <div className="operacao-conteudo">{conteudo}</div>;
  return <section className={cartao ? 'cartao cadastro' : 'pagina'}>{conteudo}</section>;
}
