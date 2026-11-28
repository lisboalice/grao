/**
 * contaRepository — Firebase Authentication (e-mail e senha, Google) e o perfil em users/{uid} (RF13).
 */
import { PerfilUsuario } from '../models/tipos';
import {
  auth,
  createUserWithEmailAndPassword,
  db,
  deleteDoc,
  deleteUser,
  doc,
  EmailAuthProvider,
  entrarComGoogleFirebase,
  getDoc,
  onAuthStateChanged,
  onSnapshot,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  serverTimestamp,
  setDoc,
  signInWithEmailAndPassword,
  signOut,
  type Unsubscribe,
  type User,
} from '../services/firebase';

export type Usuario = User;

const docPerfil = (uid: string) => doc(db, 'users', uid);

export const PERFIL_PADRAO: Omit<PerfilUsuario, 'email' | 'nome'> = {
  tema: 'escuro',
  escalaNotas: '1-5',
};

function nomeDoEmail(email: string): string {
  const base = email.split('@')[0] ?? '';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export const contaRepository = {
  observarSessao(aoMudar: (usuario: Usuario | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, aoMudar);
  },

  async entrar(email: string, senha: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email.trim(), senha);
  },

  /** Login com Google: usa o SDK nativo no celular ou pop-up no navegador. */
  async entrarComGoogle(): Promise<void> {
    const user = await entrarComGoogleFirebase();
    await this.garantirPerfil(user);
  },

  async criarConta(email: string, senha: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), senha);
    await this.garantirPerfil(cred.user);
  },

  /** Cria o perfil no primeiro login (Tabela 9). Sem conexão, tenta de novo no próximo acesso. */
  async garantirPerfil(usuario: Usuario): Promise<void> {
    try {
      const snap = await getDoc(docPerfil(usuario.uid));
      if (snap.exists()) return;
      const email = usuario.email ?? '';
      await setDoc(docPerfil(usuario.uid), {
        nome: usuario.displayName?.trim() || nomeDoEmail(email),
        email,
        ...PERFIL_PADRAO,
        criadoEm: serverTimestamp(),
      });
    } catch {
      // offline no primeiro acesso: os valores padrão são usados até lá
    }
  },

  observarPerfil(uid: string, aoReceber: (perfil: Partial<PerfilUsuario> | null) => void): Unsubscribe {
    return onSnapshot(
      docPerfil(uid),
      (snap) => aoReceber(snap.exists() ? (snap.data() as Partial<PerfilUsuario>) : null),
      () => aoReceber(null),
    );
  },

  /** Atualiza preferências (tema, escala). Não aguarda o servidor: funciona offline. */
  atualizarPerfil(uid: string, dados: Partial<PerfilUsuario>): void {
    setDoc(docPerfil(uid), dados, { merge: true }).catch(() => undefined);
  },

  async recuperarSenha(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  },

  async sair(): Promise<void> {
    await signOut(auth);
  },

  /** Confirma a senha antes de operações sensíveis (o Firebase exige login recente para excluir a conta). */
  async reautenticar(senha: string): Promise<void> {
    const usuario = auth.currentUser;
    if (!usuario?.email) throw new Error('Sessão expirada');
    await reauthenticateWithCredential(usuario, EmailAuthProvider.credential(usuario.email, senha));
  },

  /** Remove o perfil e a conta. Os dados (degustações, cafés, fotos) são apagados antes pelo degustacaoRepository. */
  async excluirConta(): Promise<void> {
    const usuario = auth.currentUser;
    if (!usuario) return;
    await deleteDoc(docPerfil(usuario.uid));
    await deleteUser(usuario);
  },
};

/** Traduz os códigos de erro do Firebase Authentication e indica abaixo de qual campo mostrar. */
export function mensagemErroAuth(erro: unknown): { campo: 'email' | 'senha' | 'geral'; mensagem: string } {
  const codigo = (erro as { code?: string })?.code ?? '';
  switch (codigo) {
    case 'auth/invalid-email':
      return { campo: 'email', mensagem: 'E-mail inválido.' };
    case 'auth/user-not-found':
      return { campo: 'email', mensagem: 'Não há conta com este e-mail.' };
    case 'auth/email-already-in-use':
      return { campo: 'email', mensagem: 'Este e-mail já está em uso.' };
    case 'auth/user-disabled':
      return { campo: 'email', mensagem: 'Esta conta foi desativada.' };
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return { campo: 'senha', mensagem: 'E-mail ou senha incorretos.' };
    case 'auth/weak-password':
      return { campo: 'senha', mensagem: 'A senha precisa ter pelo menos 6 caracteres.' };
    case 'auth/missing-password':
      return { campo: 'senha', mensagem: 'Informe a senha.' };
    case 'google/cancelado':
      return { campo: 'geral', mensagem: '' }; // o usuário fechou a janela: não é erro
    case 'google/sem-token':
      return { campo: 'geral', mensagem: 'Login com Google mal configurado (webClientId). Verifique o .env.' };
    case 'google/play-services':
      return { campo: 'geral', mensagem: 'Google Play Services indisponível neste aparelho.' };
    case 'auth/popup-blocked':
      return { campo: 'geral', mensagem: 'O navegador bloqueou a janela de login. Permita pop-ups e tente de novo.' };
    case 'auth/account-exists-with-different-credential':
      return { campo: 'geral', mensagem: 'Já existe uma conta com este e-mail. Entre com e-mail e senha.' };
    case 'auth/too-many-requests':
      return { campo: 'geral', mensagem: 'Muitas tentativas. Aguarde um pouco e tente de novo.' };
    case 'auth/network-request-failed':
      return { campo: 'geral', mensagem: 'Sem conexão. Verifique a internet e tente de novo.' };
    default:
      return { campo: 'geral', mensagem: 'Não foi possível concluir. Tente novamente.' };
  }
}