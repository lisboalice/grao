/**
 * Instâncias e SDK do Firebase via React Native Firebase (módulos nativos Android/iOS).
 * O cache offline do Firestore já vem ativado por padrão no Android e no iOS (RNF03).
 * A configuração do projeto vem de google-services.json / GoogleService-Info.plist.
 */
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from '@react-native-firebase/auth';
import type { User } from '@react-native-firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from '@react-native-firebase/firestore';
import type { DocumentData, Unsubscribe } from '@react-native-firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  listAll,
  putFile,
  ref,
} from '@react-native-firebase/storage';

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();

export {
  collection,
  createUserWithEmailAndPassword,
  deleteDoc,
  deleteObject,
  deleteUser,
  doc,
  EmailAuthProvider,
  getDoc,
  getDocs,
  getDownloadURL,
  listAll,
  onAuthStateChanged,
  onSnapshot,
  orderBy,
  query,
  reauthenticateWithCredential,
  ref,
  sendPasswordResetEmail,
  serverTimestamp,
  setDoc,
  signInWithEmailAndPassword,
  signOut,
  Timestamp,
  updateDoc,
  writeBatch,
};
export type { DocumentData, Unsubscribe, User };

let googleConfigurado = false;
function configurarGoogle() {
  if (googleConfigurado) return;
  // ID do cliente "Web" do Google Cloud / Firebase (Authentication > Google > Web SDK).
  GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });
  googleConfigurado = true;
}

/** Login com Google no Android/iOS via SDK nativo. */
export async function entrarComGoogleFirebase(): Promise<User> {
  configurarGoogle();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const resposta = await GoogleSignin.signIn();
    if (resposta.type !== 'success') {
      throw { code: 'google/cancelado' };
    }
    if (!resposta.data.idToken) {
      // Conta escolhida, mas sem token: o webClientId está ausente ou errado.
      throw { code: 'google/sem-token' };
    }
    const cred = GoogleAuthProvider.credential(resposta.data.idToken);
    const { user } = await signInWithCredential(auth, cred);
    return user;
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS) {
        throw { code: 'google/cancelado' };
      }
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw { code: 'google/play-services' };
      }
    }
    throw e;
  }
}

/** Envia um arquivo local (URI do aparelho) ao Cloud Storage. */
export async function enviarArquivoStorage(
  referencia: ReturnType<typeof ref>,
  uriLocal: string,
  contentType: string,
): Promise<void> {
  await putFile(referencia, uriLocal, { contentType });
}
