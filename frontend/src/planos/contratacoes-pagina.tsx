import type { ApiCliente } from '../api/cliente.ts';
import type { Plano } from '../api/tipos.ts';
import { useConsulta } from '../hooks/useConsulta.ts';
import { LinkInterno } from '../rotas/navegacao.tsx';
import { Comprovante } from './checkout.tsx';
import { contratacoesConfirmadas } from './contratacoes.ts';
import { pagamentoConfirmado } from './pagamento.ts';

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatarData(valor: string | null): string {
  if (!valor) return '—';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString('pt-BR');
}

export function PaginaContratacoes({ api, token }: { api: ApiCliente; token: string }) {
  const { estado, recarregar } = useConsulta('contratacoes', () => api.obterTicket());

  return (
    <main className="pagina">
      <h1>Contratações</h1>
      {estado.tipo === 'loading' ? <p role="status">Carregando contratações…</p> : null}
      {estado.tipo === 'error' ? (
        <>
          <p role="alert">{estado.mensagem}</p>
          <button type="button" onClick={recarregar}>
            Tentar novamente
          </button>
        </>
      ) : null}
      {estado.tipo === 'ready' && contratacoesConfirmadas(estado.dados, token).length === 0 ? (
        <p>Você ainda não tem contratações confirmadas.</p>
      ) : null}
      {estado.tipo === 'ready' ? (
        <ul>
          {contratacoesConfirmadas(estado.dados, token).map((item) => (
            <li key={item.identificador}>
              <p>
                {item.placa} · {item.status} · {formatarMoeda(item.valor)} · {formatarData(item.validade)}
              </p>
              <LinkInterno href="/cliente/comprovante">Ver comprovante</LinkInterno>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}

export function PaginaComprovante({
  api,
  token,
  planoId,
}: {
  api: ApiCliente;
  token: string;
  planoId: string | null;
}) {
  const ticket = useConsulta('comprovante', () => api.obterTicket());
  const plano = useConsulta(planoId ? `comprovante-plano-${planoId}` : null, () => api.obterPlano(planoId!));
  const planoPronto: Plano | null = plano.estado.tipo === 'ready' ? plano.estado.dados : null;

  return (
    <main className="pagina">
      <h1>Comprovante</h1>
      {ticket.estado.tipo === 'loading' ? <p role="status">Carregando comprovante…</p> : null}
      {ticket.estado.tipo === 'error' ? (
        <>
          <p role="alert">{ticket.estado.mensagem}</p>
          <button type="button" onClick={ticket.recarregar}>
            Tentar novamente
          </button>
        </>
      ) : null}
      {ticket.estado.tipo === 'ready' && !pagamentoConfirmado(ticket.estado.dados.status) ? (
        <p>O pagamento deste ticket não está confirmado.</p>
      ) : null}
      {ticket.estado.tipo === 'ready' && pagamentoConfirmado(ticket.estado.dados.status) ? (
        <Comprovante identificador={token} ticket={ticket.estado.dados} pagamento={null} plano={planoPronto} />
      ) : null}
    </main>
  );
}
