/**
 * ViewModel da sessão (useAuth): estado de login, perfil do usuário e ações de conta.
 * Também aplica o tema salvo no perfil (RF12).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PerfilUsuario } from '../models/tipos';
import { contaRepository, PERFIL_PADRAO, Usuario } from '../repositories/contaRepository';
import { degustacaoRepository } from '../repositories/degustacaoRepository';
import { useTema } from '../theme/TemaContext';

interface SessaoValor {
  usuario: Usuario | null;
  perfil: PerfilUsuario;
  iniciando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  criarConta: (email: string, senha: string) => Promise<void>;
  recuperarSenha: (email: string) => Promise<void>;
  entrarComGoogle: () => Promise<void>;
  sair: () => Promise<void>;
  atualizarPreferencias: (dados: Partial<Pick<PerfilUsuario, 'tema' | 'escalaNotas'>>) => void;
  excluirContaEDados: (senha: string) => Promise<void>;
}

const SessaoContext = createContext<SessaoValor | null>(null);

export function SessaoProvider({ children }: { children: React.ReactNode }) {
  const { setModo } = useTema();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [iniciando, setIniciando] = useState(true);
  const [perfilSalvo, setPerfilSalvo] = useState<Partial<PerfilUsuario> | null>(null);

  useEffect(
    () =>
      contaRepository.observarSessao((u) => {
        setUsuario(u);
        setIniciando(false);
        if (u) contaRepository.garantirPerfil(u);
      }),
    [],
  );

  useEffect(() => {
    if (!usuario) {
      setPerfilSalvo(null);
      return;
    }
    return contaRepository.observarPerfil(usuario.uid, setPerfilSalvo);
  }, [usuario]);

  const perfil: PerfilUsuario = useMemo(
    () => ({
      nome: perfilSalvo?.nome ?? '',
      email: perfilSalvo?.email ?? usuario?.email ?? '',
      tema: perfilSalvo?.tema ?? PERFIL_PADRAO.tema,
      escalaNotas: perfilSalvo?.escalaNotas ?? PERFIL_PADRAO.escalaNotas,
    }),
    [perfilSalvo, usuario],
  );

  useEffect(() => setModo(perfil.tema), [perfil.tema, setModo]);

  const atualizarPreferencias = useCallback<SessaoValor['atualizarPreferencias']>(
    (dados) => {
      if (!usuario) return;
      setPerfilSalvo((atual) => ({ ...atual, ...dados })); // resposta imediata na interface
      contaRepository.atualizarPerfil(usuario.uid, dados);
    },
    [usuario],
  );

  const excluirContaEDados = useCallback(
    async (senha: string) => {
      if (!usuario) return;
      await contaRepository.reautenticar(senha);
      await degustacaoRepository.excluirTudo(usuario.uid);
      await contaRepository.excluirConta();
    },
    [usuario],
  );

  const valor: SessaoValor = {
    usuario,
    perfil,
    iniciando,
    entrar: (email, senha) => contaRepository.entrar(email, senha),
    criarConta: (email, senha) => contaRepository.criarConta(email, senha),
    recuperarSenha: (email) => contaRepository.recuperarSenha(email),
    entrarComGoogle: () => contaRepository.entrarComGoogle(),
    sair: () => contaRepository.sair(),
    atualizarPreferencias,
    excluirContaEDados,
  };

  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>;
}

export function useAuth(): SessaoValor {
  const ctx = useContext(SessaoContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <SessaoProvider>');
  return ctx;
}

/** Atalho para telas que só existem com usuário logado. */
export function useUid(): string {
  const { usuario } = useAuth();
  if (!usuario) throw new Error('Usuário não autenticado');
  return usuario.uid;
}