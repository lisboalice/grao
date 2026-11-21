/**
 * Painéis que sobem da parte de baixo da tela:
 * - SeletorOpcoes: lista para escolher um valor (processo, filtro de origem/método/nota);
 * - BottomSheet: painel do mapa com os cafés de uma origem (RF11).
 */
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { raios, useTema } from '../theme/TemaContext';
import { Titulo } from './ui';

export interface Opcao<T> {
  valor: T;
  rotulo: string;
}

export function SeletorOpcoes<T>({
  visivel,
  titulo,
  opcoes,
  selecionado,
  onEscolher,
  onFechar,
}: {
  visivel: boolean;
  titulo: string;
  opcoes: Opcao<T>[];
  selecionado: T;
  onEscolher: (valor: T) => void;
  onFechar: () => void;
}) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar}>
      <Pressable style={estilos.fundoEscuro} onPress={onFechar} accessibilityLabel="Fechar" />
      <View
        style={[
          estilos.painel,
          { backgroundColor: cores.superficie, borderColor: cores.borda, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <View style={[estilos.alca, { backgroundColor: cores.borda }]} />
        <Text style={[estilos.tituloSeletor, { color: cores.texto }]}>{titulo}</Text>
        <ScrollView style={{ maxHeight: 420 }}>
          {opcoes.map((op) => {
            const ativo = op.valor === selecionado;
            return (
              <Pressable
                key={op.rotulo}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                onPress={() => {
                  onEscolher(op.valor);
                  onFechar();
                }}
                style={({ pressed }) => [
                  estilos.opcao,
                  { borderBottomColor: cores.borda, backgroundColor: pressed ? cores.superficieElevada : 'transparent' },
                ]}
              >
                <Text style={{ color: ativo ? cores.destaqueTexto : cores.texto, fontSize: 17, fontWeight: ativo ? '700' : '400' }}>
                  {op.rotulo}
                </Text>
                {ativo && <Feather name="check" size={20} color={cores.destaqueTexto} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function BottomSheet({
  visivel,
  titulo,
  subtitulo,
  onFechar,
  children,
}: {
  visivel: boolean;
  titulo: string;
  subtitulo?: string;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  const { cores } = useTema();
  const deslocamento = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    Animated.timing(deslocamento, {
      toValue: visivel ? 0 : 500,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [visivel, deslocamento]);

  return (
    <Animated.View
      pointerEvents={visivel ? 'auto' : 'none'}
      accessibilityViewIsModal={visivel}
      style={[
        estilos.sheet,
        { backgroundColor: cores.superficie, borderColor: cores.borda, transform: [{ translateY: deslocamento }] },
      ]}
    >
      <View style={[estilos.alca, { backgroundColor: cores.borda }]} />
      <View style={estilos.sheetTopo}>
        <View style={{ flex: 1 }}>
          <Titulo tamanho={30}>{titulo}</Titulo>
          {subtitulo && <Text style={{ color: cores.textoSecundario, fontSize: 15, marginTop: 2 }}>{subtitulo}</Text>}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onFechar}
          style={[estilos.fechar, { borderColor: cores.borda }]}
        >
          <Text style={{ color: cores.textoSecundario, fontSize: 16 }}>Fechar</Text>
        </Pressable>
      </View>
      {children}
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  fundoEscuro: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  painel: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  alca: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 14 },
  tituloSeletor: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  opcao: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  sheetTopo: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  fechar: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: raios.pilula,
    borderWidth: 1,
    justifyContent: 'center',
  },
});
