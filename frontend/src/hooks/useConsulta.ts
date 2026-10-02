import { useCallback, useEffect, useRef, useState } from 'react';
import { mensagemDoErro } from '../api/erro-api.ts';

export type EstadoConsulta<T> =
  | { tipo: 'loading' }
  | { tipo: 'ready'; dados: T }
  | { tipo: 'empty' }
  | { tipo: 'error'; mensagem: string };

export function useConsulta<T>(
  chave: string | null,
  carregar: () => Promise<T>,
  estaVazio: (dados: T) => boolean = () => false,
): { estado: EstadoConsulta<T>; recarregar: () => void } {
  const carregarRef = useRef(carregar);
  const vazioRef = useRef(estaVazio);
  const [versao, setVersao] = useState(0);
  const chaveEfetiva = chave === null ? null : `${chave}:${versao}`;
  const [vista, setVista] = useState(chaveEfetiva);
  const [estado, setEstado] = useState<EstadoConsulta<T>>(() =>
    chave === null
      ? { tipo: 'error', mensagem: 'Acesso não autorizado para esta consulta.' }
      : { tipo: 'loading' },
  );

  if (vista !== chaveEfetiva) {
    setVista(chaveEfetiva);
    setEstado(
      chaveEfetiva === null
        ? { tipo: 'error', mensagem: 'Acesso não autorizado para esta consulta.' }
        : { tipo: 'loading' },
    );
  }

  useEffect(() => {
    carregarRef.current = carregar;
    vazioRef.current = estaVazio;
  });

  useEffect(() => {
    if (chave === null) return;
    let cancelado = false;
    carregarRef
      .current()
      .then((dados) => {
        if (cancelado) return;
        setEstado(vazioRef.current(dados) ? { tipo: 'empty' } : { tipo: 'ready', dados });
      })
      .catch((erro: unknown) => {
        if (cancelado) return;
        setEstado({ tipo: 'error', mensagem: mensagemDoErro(erro) });
      });
    return () => {
      cancelado = true;
    };
  }, [chave, versao]);

  const recarregar = useCallback(() => {
    setVersao((atual) => atual + 1);
  }, []);

  return { estado, recarregar };
}
