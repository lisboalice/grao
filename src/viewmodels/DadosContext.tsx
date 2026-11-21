/**
 * Fonte única e reativa das degustações do usuário (listener onSnapshot) e dos catálogos.
 * Diário, Dashboard e Mapa leem daqui, então se atualizam sozinhos quando algo é salvo,
 * editado ou excluído — inclusive offline, a partir do cache do Firestore (Figura 7, passo 6).
 */
import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Degustacao } from '../models/tipos';
import { Catalogos, CATALOGOS_EMBUTIDOS, catalogoRepository } from '../repositories/catalogoRepository';
import { degustacaoRepository } from '../repositories/degustacaoRepository';
import { useUid } from './useAuth';

interface DadosValor {
  degustacoes: Degustacao[];
  carregando: boolean;
  erro: string | null;
  /** Há alterações salvas só no aparelho, esperando sincronizar. */
  pendentes: boolean;
  online: boolean;
  catalogos: Catalogos;
}

const DadosContext = createContext<DadosValor | null>(null);

export function DadosProvider({ children }: { children: React.ReactNode }) {
  const uid = useUid();
  const [degustacoes, setDegustacoes] = useState<Degustacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pendentes, setPendentes] = useState(false);
  const [online, setOnline] = useState(true);
  const [catalogos, setCatalogos] = useState<Catalogos>(CATALOGOS_EMBUTIDOS);

  useEffect(() => {
    setCarregando(true);
    return degustacaoRepository.observarTodas(
      uid,
      (lista, meta) => {
        setDegustacoes(lista);
        setPendentes(meta.pendentes);
        setCarregando(false);
        setErro(null);
      },
      () => {
        setErro('Não foi possível carregar seus cafés.');
        setCarregando(false);
      },
    );
  }, [uid]);

  useEffect(() => {
    catalogoRepository.carregar().then(setCatalogos);
  }, []);

  useEffect(
    () => NetInfo.addEventListener((estado) => setOnline(estado.isConnected !== false)),
    [],
  );

  // Fotos que ficaram só no aparelho são enviadas quando houver conexão (RF02 / RNF03).
  useEffect(() => {
    if (online) degustacaoRepository.sincronizarFotosPendentes(uid, degustacoes);
  }, [online, degustacoes, uid]);

  return (
    <DadosContext.Provider value={{ degustacoes, carregando, erro, pendentes, online, catalogos }}>
      {children}
    </DadosContext.Provider>
  );
}

export function useDados(): DadosValor {
  const ctx = useContext(DadosContext);
  if (!ctx) throw new Error('useDados precisa estar dentro de <DadosProvider>');
  return ctx;
}
