import type { FormEvent } from 'react';
import { useState } from 'react';
import { autenticarAtendente, EMAIL_ATENDENTE, SENHA_ATENDENTE } from '../auth/login.ts';

export function PaginaLogin({
  mensagem,
  aoEntrar,
}: {
  mensagem: string | null;
  aoEntrar: (conta: { nome: string; email: string }) => void;
}) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const conta = autenticarAtendente(email, senha);
    if (!conta) {
      setErro('E-mail ou senha incorretos.');
      return;
    }
    setErro(null);
    aoEntrar(conta);
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
          <p className="marca-redonda" aria-hidden="true">
            AP
          </p>
          <h1>AutoPark</h1>
          <p>Acesse sua conta</p>
          {mensagem ? <p role="alert">{mensagem}</p> : null}
          {erro ? <p role="alert">{erro}</p> : null}
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="Digite seu e-mail"
              autoComplete="username"
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit">Entrar</button>
          <p className="dica">
            Use seu e-mail e senha para acessar o painel. Conta local: {EMAIL_ATENDENTE} / {SENHA_ATENDENTE}.
          </p>
        </form>
      </div>
    </main>
  );
}
