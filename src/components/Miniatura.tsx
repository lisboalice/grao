/**
 * Miniatura do café: a foto, quando existe; senão, um quadrado em degradê com a xícara.
 * Usa a cópia local (offline) antes da URL do Cloud Storage.
 */
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleProp, View, ViewStyle } from 'react-native';
import { Degustacao } from '../models/tipos';
import { arquivoLocalExiste } from '../services/fotos';
import { coresMiniatura } from '../theme/cores';

export function uriDaFoto(d: Pick<Degustacao, 'fotoLocalUri' | 'fotoUrl'>): string | null {
  if (arquivoLocalExiste(d.fotoLocalUri)) return d.fotoLocalUri;
  return d.fotoUrl;
}

export function coresPorNome(nome: string): [string, string] {
  let h = 0;
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return coresMiniatura[h % coresMiniatura.length];
}

export function Miniatura({
  uri,
  nome,
  tamanho = 68,
  raio = 16,
  style,
}: {
  uri: string | null;
  nome: string;
  tamanho?: number;
  raio?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const caixa = { width: tamanho, height: tamanho, borderRadius: raio, overflow: 'hidden' as const };
  if (uri) {
    return (
      <View style={[caixa, style]}>
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
      </View>
    );
  }
  return (
    <LinearGradient
      colors={coresPorNome(nome)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[caixa, { alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Feather name="coffee" size={tamanho * 0.42} color="#E8B97A" />
    </LinearGradient>
  );
}
