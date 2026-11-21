/**
 * Slider de 1 a 5 de um atributo sensorial, com dica em linguagem simples e tooltip
 * explicativo (RF04). Componente próprio: arrastar ou tocar na trilha; acessível como
 * "ajustável" (leitores de tela aumentam/diminuem o valor — RNF05).
 */
import { Feather } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import type { HostInstance } from 'react-native';
import { AtributoSensorial } from '../models/tipos';
import { useTema } from '../theme/TemaContext';

const MIN = 1;
const MAX = 5;
const POLEGAR = 34;

interface Props {
  atributo: AtributoSensorial;
  valor: number;
  onChange: (valor: number) => void;
}

export function SliderNota({ atributo, valor, onChange }: Props) {
  const { cores } = useTema();
  const [largura, setLargura] = useState(0);
  const [mostrarDica, setMostrarDica] = useState(false);
  const trilha = useRef<HostInstance>(null);
  const inicioTrilha = useRef(0);
  const ultimo = useRef(valor);
  ultimo.current = valor;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const larguraRef = useRef(0);
  larguraRef.current = largura;

  function valorNaPosicao(pageX: number): number {
    const util = larguraRef.current - POLEGAR;
    if (util <= 0) return ultimo.current;
    const x = pageX - inicioTrilha.current - POLEGAR / 2;
    const proporcao = Math.min(1, Math.max(0, x / util));
    return Math.round(MIN + proporcao * (MAX - MIN));
  }

  function aplicar(pageX: number) {
    const novo = valorNaPosicao(pageX);
    if (novo !== ultimo.current) onChangeRef.current(novo);
  }

  const gesto = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        trilha.current?.measure((_x, _y, _w, _h, pageX) => {
          inicioTrilha.current = pageX;
          aplicar(e.nativeEvent.pageX);
        });
      },
      onPanResponderMove: (_e, g) => aplicar(g.moveX),
    }),
  ).current;

  const posicao = largura > 0 ? ((valor - MIN) / (MAX - MIN)) * (largura - POLEGAR) : 0;

  return (
    <View style={{ marginBottom: 6 }}>
      <View style={estilos.topo}>
        <Pressable
          onPress={() => setMostrarDica((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={`O que é ${atributo.nome}?`}
          hitSlop={10}
          style={estilos.nomeLinha}
        >
          <Text style={[estilos.nome, { color: cores.texto }]}>{atributo.nome}</Text>
          <Feather name="info" size={15} color={cores.textoSecundario} style={{ marginLeft: 6 }} />
        </Pressable>
        <Text style={[estilos.valor, { color: cores.destaqueTexto }]}>{valor}</Text>
      </View>
      <Text style={{ color: cores.textoSecundario, fontSize: 15, marginTop: 2 }}>{atributo.dica}</Text>

      {mostrarDica && (
        <View
          accessibilityLiveRegion="polite"
          style={[estilos.tooltip, { backgroundColor: cores.superficieElevada, borderColor: cores.borda }]}
        >
          <Text style={{ color: cores.texto, fontSize: 14 }}>
            <Text style={{ fontWeight: '700' }}>O que você sente: </Text>
            {atributo.oQueSente}.
          </Text>
          <Text style={{ color: cores.textoSecundario, fontSize: 13, marginTop: 4 }}>
            1 = {atributo.ancoraMin} · 5 = {atributo.ancoraMax}
          </Text>
        </View>
      )}

      <View
        ref={trilha}
        onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
        style={estilos.area}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`${atributo.nome}. ${atributo.dica}`}
        accessibilityValue={{ min: MIN, max: MAX, now: valor, text: `${valor} de 5` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') onChange(Math.min(MAX, valor + 1));
          if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(MIN, valor - 1));
        }}
        {...gesto.panHandlers}
      >
        <View style={[estilos.trilha, { backgroundColor: cores.trilha }]} />
        <View
          style={[estilos.preenchimento, { backgroundColor: cores.destaque, width: posicao + POLEGAR / 2 }]}
        />
        <View
          style={[
            estilos.polegar,
            { left: posicao, backgroundColor: cores.polegar, borderColor: cores.bordaPolegar },
          ]}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nomeLinha: { flexDirection: 'row', alignItems: 'center' },
  nome: { fontSize: 19, fontWeight: '700' },
  valor: { fontSize: 19, fontWeight: '700' },
  tooltip: { marginTop: 8, borderWidth: 1, borderRadius: 12, padding: 12 },
  area: { height: 48, justifyContent: 'center' },
  trilha: { position: 'absolute', left: 0, right: 0, height: 9, borderRadius: 5 },
  preenchimento: { position: 'absolute', left: 0, height: 9, borderRadius: 5 },
  polegar: {
    position: 'absolute',
    width: POLEGAR,
    height: POLEGAR,
    borderRadius: POLEGAR / 2,
    borderWidth: 5,
  },
});
