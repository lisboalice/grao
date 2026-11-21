/**
 * Instâncias do Firebase via React Native Firebase (módulos nativos).
 * O cache offline do Firestore já vem ativado por padrão no Android e no iOS (RNF03).
 * A configuração do projeto vem de google-services.json / GoogleService-Info.plist.
 */
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();
