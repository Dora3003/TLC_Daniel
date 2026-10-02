import { useEffect, useMemo, useState } from 'react';
import { decidirAcesso, MENSAGENS_ACESSO, type MotivoNegacao } from '../auth/acesso.ts';
import {
  armazenamentoDaSessao,
  gravarSessao,
  lerSessao,
  mesmaSessao,
  type Sessao,
} from '../auth/sessao.ts';
import { criarApiAtendente } from '../api/atendente.ts';
import { criarApiCliente } from '../api/cliente.ts';
import { criarHttp } from '../api/http.ts';
import { urlDaApi } from '../api/url.ts';
import { AreaAtendente, AreaCliente } from '../paginas/areas.tsx';
import { PaginaLogin } from '../atendimento/login-pagina.tsx';
import { PaginaLoginCliente } from '../planos/login-cliente.tsx';
import { PaginaConfirmarPagamento } from '../planos/confirmar-pagamento.tsx';
import { useNavegacao } from '../rotas/contexto-navegacao.ts';
import { ProvedorNavegacao } from '../rotas/navegacao.tsx';

function lerAviso(search: string): MotivoNegacao | null {
  const valor = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('aviso');
  if (valor && valor in MENSAGENS_ACESSO) return valor as MotivoNegacao;
  return null;
}

export function Aplicacao() {
  return (
    <ProvedorNavegacao>
      <Conteudo />
    </ProvedorNavegacao>
  );
}

function Conteudo() {
  const { pathname, search, navegar, substituir } = useNavegacao();
  const armazenamento = useMemo(() => armazenamentoDaSessao(), []);
  const [sessao, setSessao] = useState<Sessao>(() => lerSessao(armazenamento));
  const http = useMemo(() => criarHttp(globalThis.fetch.bind(globalThis), urlDaApi()), []);
  const decisao = decidirAcesso(pathname, search, sessao);
  const tokenCliente = decisao.sessao?.papel === 'cliente' ? decisao.sessao.token : null;
  const apiCliente = useMemo(
    () => (tokenCliente ? criarApiCliente(http, { papel: 'cliente', token: tokenCliente }) : null),
    [http, tokenCliente],
  );
  const apiAtendente = useMemo(() => criarApiAtendente(http), [http]);

  if (!mesmaSessao(sessao, decisao.sessao)) {
    gravarSessao(armazenamento, decisao.sessao);
    setSessao(decisao.sessao);
  }

  useEffect(() => {
    const confirmaPagamento = pathname === '/pagar' || pathname === '/pagar-multa';
    if (pathname === decisao.destino) return;
    if (confirmaPagamento) return;
    const destino = decisao.motivo ? `${decisao.destino}?aviso=${decisao.motivo}` : decisao.destino;
    substituir(destino);
  }, [decisao.destino, decisao.motivo, pathname, substituir]);

  const aviso = lerAviso(search);
  const mensagem = aviso ? MENSAGENS_ACESSO[aviso] : null;

  function entrar(conta: { nome: string; email: string }) {
    const proxima: Sessao = { papel: 'atendente', nome: conta.nome, email: conta.email };
    gravarSessao(armazenamento, proxima);
    setSessao(proxima);
    navegar('/atendimento');
  }

  function sair() {
    gravarSessao(armazenamento, null);
    setSessao(null);
    navegar('/');
  }

  if (decisao.destino === '/pagar' || decisao.destino === '/pagar-multa') {
    return <PaginaConfirmarPagamento tipo={decisao.destino === '/pagar' ? 'estadia' : 'multa'} />;
  }

  if (decisao.destino.startsWith('/cliente') && apiCliente && decisao.sessao?.papel === 'cliente') {
    return (
      <AreaCliente
        api={apiCliente}
        destino={decisao.destino}
        mensagem={mensagem}
        token={decisao.sessao.token}
        aoSair={sair}
      />
    );
  }

  if (decisao.destino.startsWith('/atendimento') && decisao.sessao?.papel === 'atendente') {
    return (
      <AreaAtendente
        api={apiAtendente}
        destino={decisao.destino}
        mensagem={mensagem}
        nome={decisao.sessao.nome ?? 'Atendente'}
        aoSair={sair}
      />
    );
  }

  if (decisao.destino.startsWith('/atendimento')) {
    return <PaginaLogin mensagem={mensagem} aoEntrar={entrar} />;
  }

  return <PaginaLoginCliente mensagem={mensagem} />;
}
