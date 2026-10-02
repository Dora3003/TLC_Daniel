import { ErroApi } from './erro-api.ts';

export interface Http {
  get<T>(caminho: string): Promise<T>;
  post<T>(caminho: string, body?: unknown): Promise<T>;
}

interface ErroContrato {
  erro: string;
  mensagem: string;
  valorMulta?: number;
}

function contratoDeErro(valor: unknown): valor is ErroContrato {
  if (!valor || typeof valor !== 'object') return false;
  const corpo = valor as { erro?: unknown; mensagem?: unknown; valorMulta?: unknown };
  if (typeof corpo.erro !== 'string' || typeof corpo.mensagem !== 'string') return false;
  return corpo.valorMulta === undefined || typeof corpo.valorMulta === 'number';
}

export function criarHttp(buscar: typeof fetch, baseUrl: string): Http {
  const base = baseUrl.replace(/\/$/, '');

  async function solicitar<T>(caminho: string, init?: RequestInit): Promise<T> {
    let resposta: Response;
    try {
      resposta = await buscar(`${base}${caminho}`, init);
    } catch (erro: unknown) {
      console.error('falha de rede', erro instanceof Error ? erro.name : 'desconhecida');
      throw new ErroApi(0, 'ERRO_REDE', 'Não foi possível concluir a operação. Tente novamente.');
    }

    const texto = await resposta.text();
    let corpo: unknown = null;
    if (texto) {
      try {
        corpo = JSON.parse(texto) as unknown;
      } catch {
        corpo = null;
      }
    }

    if (!resposta.ok) {
      console.error('falha na api', { status: resposta.status });
      if (contratoDeErro(corpo)) {
        throw new ErroApi(resposta.status, corpo.erro, corpo.mensagem, corpo.valorMulta);
      }
      throw new ErroApi(
        resposta.status,
        'ERRO_INTERNO',
        'Não foi possível concluir a operação. Tente novamente.',
      );
    }

    if (corpo === null) {
      throw new ErroApi(
        resposta.status,
        'ERRO_INTERNO',
        'Não foi possível concluir a operação. Tente novamente.',
      );
    }

    return corpo as T;
  }

  return {
    get: (caminho) =>
      solicitar(caminho, {
        headers: { Accept: 'application/json' },
      }),
    post: (caminho, body) => {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      return solicitar(caminho, {
        method: 'POST',
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },
  };
}
