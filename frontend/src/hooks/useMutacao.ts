import { useCallback, useEffect, useRef, useState } from 'react';
import { mensagemDoErro } from '../api/erro-api.ts';

export type EstadoMutacao<T> =
  | { tipo: 'idle' }
  | { tipo: 'submitting' }
  | { tipo: 'ready'; dados: T }
  | { tipo: 'error'; mensagem: string };

export function reservarEnvio(trava: { ocupada: boolean }): boolean {
  if (trava.ocupada) return false;
  trava.ocupada = true;
  return true;
}

export function liberarEnvio(trava: { ocupada: boolean }): void {
  trava.ocupada = false;
}

export function useMutacao<T>(executar: () => Promise<T>): {
  estado: EstadoMutacao<T>;
  enviar: () => Promise<void>;
} {
  const executarRef = useRef(executar);
  const trava = useRef({ ocupada: false });
  const [estado, setEstado] = useState<EstadoMutacao<T>>({ tipo: 'idle' });

  useEffect(() => {
    executarRef.current = executar;
  });

  const enviar = useCallback(async () => {
    if (!reservarEnvio(trava.current)) return;
    setEstado({ tipo: 'submitting' });
    try {
      const dados = await executarRef.current();
      setEstado({ tipo: 'ready', dados });
    } catch (erro: unknown) {
      setEstado({ tipo: 'error', mensagem: mensagemDoErro(erro) });
    } finally {
      liberarEnvio(trava.current);
    }
  }, []);

  return { estado, enviar };
}
