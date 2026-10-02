export class ErroApi extends Error {
  readonly codigo: string;
  readonly status: number;
  readonly valorMulta?: number;

  constructor(status: number, codigo: string, mensagem: string, valorMulta?: number) {
    super(mensagem);
    this.name = 'ErroApi';
    this.codigo = codigo;
    this.status = status;
    this.valorMulta = valorMulta;
  }
}

export function mensagemDoErro(erro: unknown): string {
  if (erro instanceof ErroApi && erro.message.trim() !== '') return erro.message;
  return 'Não foi possível concluir a operação. Tente novamente.';
}
