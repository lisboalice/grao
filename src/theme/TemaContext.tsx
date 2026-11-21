import React, { createContext, useContext, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { Paleta, temaClaro, temaEscuro } from './cores';

export type ModoTema = 'escuro' | 'claro';

/** Serifa nos títulos (universo gastronômico) e sem serifa na interface (legibilidade). */
export const fontes = {
  titulo: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string,
  interface: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
};

export const espacos = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
export const raios = { pequeno: 12, medio: 16, grande: 22, pilula: 999 };

/** Área mínima de toque (RNF01: pelo menos 48 dp). */
export const ALVO_TOQUE = 48;

interface TemaValor {
  modo: ModoTema;
  cores: Paleta;
  setModo: (modo: ModoTema) => void;
}

const TemaContext = createContext<TemaValor | null>(null);

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const [modo, setModo] = useState<ModoTema>('escuro');
  const valor = useMemo(
    () => ({ modo, setModo, cores: modo === 'escuro' ? temaEscuro : temaClaro }),
    [modo],
  );
  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export function useTema(): TemaValor {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error('useTema precisa estar dentro de <TemaProvider>');
  return ctx;
}
