import type { FormEvent } from 'react';
import { useState } from 'react';
import { MarcaAutoPark } from '../app/marca.tsx';
import { normalizarToken, tokenValido } from '../auth/token.ts';
import { useNavegacao } from '../rotas/contexto-navegacao.ts';
import { LinkInterno } from '../rotas/navegacao.tsx';

export function PaginaLoginCliente({ mensagem }: { mensagem: string | null }) {
  const { navegar } = useNavegacao();
  const [token, setToken] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!tokenValido(token)) {
      setErro('O token do ticket é inválido.');
      return;
    }
    setErro(null);
    navegar(`/?token=${normalizarToken(token)}`);
  }

  return (
    <main className="aplicacao autopark login">
      <a className="pular" href="#conteudo">
        Ir para o conteúdo
      </a>
      <header className="barra">
        <p className="logo">AutoPark</p>
      </header>
      <div id="conteudo" className="login-miolo" tabIndex={-1}>
        <form className="cartao login-cartao" onSubmit={aoEnviar}>
          <MarcaAutoPark />
          <h1>AutoPark</h1>
          <p>Acesse sua conta</p>
          {mensagem ? <p role="alert">{mensagem}</p> : null}
          {erro ? <p role="alert">{erro}</p> : null}
          <label>
            Token
            <input
              value={token}
              onChange={(evento) => setToken(evento.target.value)}
              placeholder="Digite o seu token"
              autoComplete="off"
              required
            />
          </label>
          <button type="submit">Entrar</button>
          <p className="dica">Use o token enviado para acessar o painel.</p>
          <p className="dica">
            <LinkInterno href="/atendimento">Acesso do atendente</LinkInterno>
          </p>
        </form>
      </div>
    </main>
  );
}
