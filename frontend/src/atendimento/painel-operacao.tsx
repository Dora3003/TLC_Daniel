import { useState } from 'react';
import type { ApiAtendente } from '../api/atendente.ts';
import { PaginaEntradaVeiculo } from './entrada-pagina.tsx';
import { PaginaSaidaVeiculo } from './saida-pagina.tsx';

type ModoOperacao = 'entrada' | 'saida';

export function PainelOperacao({
  api,
  aoSucesso,
}: {
  api: ApiAtendente;
  aoSucesso?: () => void;
}) {
  const [modo, setModo] = useState<ModoOperacao>('entrada');

  return (
    <section className="cartao operacao">
      <div className="abas-operacao" role="tablist" aria-label="Operação do pátio">
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'entrada'}
          className={modo === 'entrada' ? 'aba ativa' : 'aba'}
          onClick={() => setModo('entrada')}
        >
          Cadastrar Veículo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'saida'}
          className={modo === 'saida' ? 'aba ativa' : 'aba'}
          onClick={() => setModo('saida')}
        >
          Saída de Veículo
        </button>
      </div>
      {modo === 'entrada' ? (
        <PaginaEntradaVeiculo api={api} embutida aoSucesso={aoSucesso} />
      ) : (
        <PaginaSaidaVeiculo api={api} embutida aoSucesso={aoSucesso} />
      )}
    </section>
  );
}
