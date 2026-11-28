/**
 * Instâncias e SDK do Firebase para Expo Web via Firebase JS SDK.
 * Habilita persistência offline em IndexedDB quando disponível no navegador (RNF03).
 */
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type { DocumentData, Firestore, Unsubscribe } from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  listAll,
  ref,
  uploadBytes,
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyDf617OJ4UcEVUQ6XR69apgvn4fBFVG8Xs',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'grao-a-graoo.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'grao-a-graoo',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'grao-a-graoo.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '676727940539',
  ...(process.env.EXPO_PUBLIC_FIREBASE_APP_ID
    ? { appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID }
    : {}),
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch {
  dbInstance = getFirestore(app);
}
export const db = dbInstance;
export const storage = getStorage(app);

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

/** Login com Google no navegador via pop-up do Firebase Auth. */
export async function entrarComGoogleFirebase(): Promise<User> {
  try {
    const provider = new GoogleAuthProvider();
    const { user } = await signInWithPopup(auth, provider);
    return user;
  } catch (e) {
    const codigo = (e as { code?: string })?.code;
    if (codigo === 'auth/popup-closed-by-user' || codigo === 'auth/cancelled-popup-request') {
      throw { code: 'google/cancelado' };
    }
    throw e;
  }
}

/** Envia uma imagem (blob: ou data: URL) ao Cloud Storage no navegador. */
export async function enviarArquivoStorage(
  referencia: ReturnType<typeof ref>,
  uriLocal: string,
  contentType: string,
): Promise<void> {
  const resposta = await fetch(uriLocal);
  const blob = await resposta.blob();
  await uploadBytes(referencia, blob, { contentType });
}
