export interface ContaAtendente {
  nome: string;
  email: string;
}

const CONTA: ContaAtendente & { senha: string } = {
  nome: 'Fabrício da Silva',
  email: 'fabricio@autopark.com',
  senha: 'autopark',
};

export const EMAIL_ATENDENTE = CONTA.email;
export const SENHA_ATENDENTE = CONTA.senha;

export function autenticarAtendente(email: string, senha: string): ContaAtendente | null {
  const informado = email.trim().toLowerCase();
  if (informado !== CONTA.email || senha !== CONTA.senha) return null;
  return { nome: CONTA.nome, email: CONTA.email };
}
