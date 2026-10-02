import { useEffect, useMemo, useRef, useState } from 'react';
import { criarApiCliente } from '../api/cliente.ts';
import { mensagemDoErro } from '../api/erro-api.ts';
import { criarHttp } from '../api/http.ts';
import { urlDaApi } from '../api/url.ts';
import { MarcaAutoPark } from '../app/marca.tsx';
import { normalizarToken, tokenValido } from '../auth/token.ts';
import { useNavegacao } from '../rotas/contexto-navegacao.ts';
import { pagarUmaVez } from './pagamento.ts';
import { pagarMultaUmaVez } from './multa.ts';

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

type Estado =
  | { tipo: 'loading' }
  | { tipo: 'ok'; mensagem: string; detalhe?: string }
  | { tipo: 'error'; mensagem: string };

export function PaginaConfirmarPagamento({ tipo }: { tipo: 'estadia' | 'multa' }) {
  const { search } = useNavegacao();
  const token = useMemo(() => {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    return normalizarToken(params.get('token') ?? '');
  }, [search]);
  const [estado, setEstado] = useState<Estado>({ tipo: 'loading' });
  const executado = useRef(false);

  useEffect(() => {
    if (executado.current) return;
    executado.current = true;

    if (!tokenValido(token)) {
      setEstado({ tipo: 'error', mensagem: 'Token inválido. Não foi possível confirmar o pagamento.' });
      return;
    }

    const http = criarHttp(globalThis.fetch.bind(globalThis), urlDaApi());
    const api = criarApiCliente(http, { papel: 'cliente', token });

    void (async () => {
      try {
        if (tipo === 'estadia') {
          const resultado = await pagarUmaVez(api);
          const valor = resultado.pagamento?.valorCobrado ?? resultado.ticket.valorAtual;
          setEstado({
            tipo: 'ok',
            mensagem: 'Pagamento confirmado',
            detalhe: `Ticket ${token} · ${formatarMoeda(valor)}`,
          });
          return;
        }

        const multa = await pagarMultaUmaVez(api);
        if (multa.tipo === 'ausente') {
          setEstado({
            tipo: 'ok',
            mensagem: 'Não há cobrança adicional pendente',
            detalhe: `Ticket ${token}`,
          });
          return;
        }
        setEstado({
          tipo: 'ok',
          mensagem: 'Cobrança adicional confirmada',
          detalhe: `Ticket ${token} · ${formatarMoeda(multa.multa.valorMulta)}`,
        });
      } catch (erro: unknown) {
        setEstado({ tipo: 'error', mensagem: mensagemDoErro(erro) });
      }
    })();
  }, [tipo, token]);

  return (
    <div className="aplicacao autopark">
      <header className="barra">
        <p className="logo">AutoPark</p>
      </header>
      <div className="cliente-miolo">
        <section className="cartao cliente-cartao">
          <header className="cliente-cabecalho">
            <MarcaAutoPark />
            <h1>AutoPark</h1>
            <p className="cliente-subtitulo">
              {tipo === 'estadia' ? 'Confirmação de pagamento' : 'Confirmação da cobrança adicional'}
            </p>
          </header>

          {estado.tipo === 'loading' ? <p role="status">Confirmando pagamento…</p> : null}
          {estado.tipo === 'ok' ? (
            <section className="comprovante" role="status">
              <h2>{estado.mensagem}</h2>
              {estado.detalhe ? <p className="dica">{estado.detalhe}</p> : null}
              <p className="dica">Você já pode fechar esta página e voltar ao app.</p>
            </section>
          ) : null}
          {estado.tipo === 'error' ? <p role="alert">{estado.mensagem}</p> : null}

          {tokenValido(token) ? (
            <p className="link-pagamento">
              <a href={`/cliente/pagamento?token=${encodeURIComponent(token)}`}>Voltar ao pagamento</a>
            </p>
          ) : (
            <p className="link-pagamento">
              <a href="/">Voltar ao início</a>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
