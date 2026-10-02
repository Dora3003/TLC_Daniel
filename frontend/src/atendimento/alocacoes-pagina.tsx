import { useState } from 'react';
import type { ApiAtendente } from '../api/atendente.ts';
import { useConsulta } from '../hooks/useConsulta.ts';
import { filtrarAlocacoes, linhasAlocacao } from './alocacoes.ts';

function formatarData(valor: string | null): string {
  if (!valor) return '—';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString('pt-BR');
}

function listaVazia(itens: readonly unknown[]): boolean {
  return itens.length === 0;
}

export function PaginaVeiculos({
  api,
  cartao = false,
  versao = 0,
}: {
  api: ApiAtendente;
  cartao?: boolean;
  versao?: number;
}) {
  const { estado, recarregar } = useConsulta(`alocacoes:${versao}`, () => api.listarAtivos(), listaVazia);
  const [busca, setBusca] = useState('');
  const linhas = estado.tipo === 'ready' ? linhasAlocacao(estado.dados) : [];
  const filtradas = filtrarAlocacoes(linhas, busca);
  const semResultado = estado.tipo === 'ready' && linhas.length > 0 && filtradas.length === 0;

  return (
    <section className={cartao ? 'cartao lista' : 'pagina'}>
      <div className="cartao-cabecalho">
        <h2>Veículos Alocados</h2>
        {estado.tipo === 'ready' || estado.tipo === 'empty' ? (
          <button type="button" className="botao-secundario" onClick={recarregar}>
            Atualizar
          </button>
        ) : null}
      </div>

      {estado.tipo === 'loading' ? <p role="status">Carregando veículos…</p> : null}
      {estado.tipo === 'error' ? (
        <div className="cartao-feedback">
          <p role="alert">{estado.mensagem}</p>
          <button type="button" onClick={recarregar}>
            Tentar novamente
          </button>
        </div>
      ) : null}
      {estado.tipo === 'empty' ? <p className="cartao-vazio">Não há veículos no pátio.</p> : null}

      {estado.tipo === 'ready' ? (
        <>
          <label className="campo-busca">
            <span>Pesquisar</span>
            <input
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por nome, token ou placa"
              autoComplete="off"
            />
          </label>

          {semResultado ? (
            <p className="cartao-vazio" role="status">
              Nenhum veículo encontrado para “{busca.trim()}”.
            </p>
          ) : (
            <div className="tabela-rolagem">
              <table>
                <caption>Veículos no pátio</caption>
                <thead>
                  <tr>
                    <th scope="col">Identificador</th>
                    <th scope="col">Placa</th>
                    <th scope="col">Motorista</th>
                    <th scope="col">Data de Alocação</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((linha, indice) => (
                    <tr key={linha.id ?? `sem-id-${indice}`}>
                      <td>{linha.id ?? '—'}</td>
                      <td>{linha.placa ?? '—'}</td>
                      <td>{linha.motoristaNome ?? '—'}</td>
                      <td>{formatarData(linha.entradaEm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
