/**
 * Componentes básicos de interface, seguindo as diretrizes visuais da seção 3.1:
 * cartões arredondados, chips de seleção, títulos com serifa e destaque âmbar só em ações e dados principais.
 */
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { ALVO_TOQUE, fontes, raios, useTema } from '../theme/TemaContext';

export function Titulo({
  children,
  tamanho = 34,
  style,
}: {
  children: React.ReactNode;
  tamanho?: number;
  style?: StyleProp<TextStyle>;
}) {
  const { cores } = useTema();
  return (
    <Text
      accessibilityRole="header"
      style={[{ fontFamily: fontes.titulo, fontWeight: '700', fontSize: tamanho, color: cores.texto }, style]}
    >
      {children}
    </Text>
  );
}

/** Rótulo de campo em caixa alta (E-MAIL, SENHA, NOME DO CAFÉ...). */
export function Rotulo({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const { cores } = useTema();
  return (
    <Text style={[{ color: cores.textoSecundario, fontSize: 13, letterSpacing: 1.2, marginBottom: 8 }, style]}>
      {String(children).toUpperCase()}
    </Text>
  );
}

export function TextoSecundario({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const { cores } = useTema();
  return <Text style={[{ color: cores.textoSecundario, fontSize: 14 }, style]}>{children}</Text>;
}

export function Cartao({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { cores } = useTema();
  return (
    <View
      style={[
        {
          backgroundColor: cores.superficie,
          borderColor: cores.borda,
          borderWidth: 1,
          borderRadius: raios.grande,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type VarianteBotao = 'primario' | 'contorno' | 'perigo';

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  carregando,
  desabilitado,
  icone,
  style,
}: {
  titulo: string;
  onPress: () => void;
  variante?: VarianteBotao;
  carregando?: boolean;
  desabilitado?: boolean;
  icone?: keyof typeof Feather.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const { cores } = useTema();
  const fundo = variante === 'primario' ? cores.destaque : 'transparent';
  const corTexto =
    variante === 'primario' ? cores.sobreDestaque : variante === 'perigo' ? cores.perigo : cores.texto;
  const borda = variante === 'perigo' ? cores.bordaPerigo : variante === 'contorno' ? cores.borda : fundo;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!desabilitado || !!carregando, busy: !!carregando }}
      disabled={desabilitado || carregando}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.botao,
        { backgroundColor: fundo, borderColor: borda, opacity: desabilitado ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <View style={estilos.linha}>
          <Text style={[estilos.textoBotao, { color: corTexto }]}>{titulo}</Text>
          {icone && <Feather name={icone} size={20} color={corTexto} style={{ marginLeft: 8 }} />}
        </View>
      )}
    </Pressable>
  );
}

export function Chip({
  texto,
  selecionado,
  onPress,
  icone,
  compacto,
  style,
}: {
  texto: string;
  selecionado?: boolean;
  onPress?: () => void;
  icone?: keyof typeof Feather.glyphMap;
  /** Reduz o texto para caber em uma linha (chips em colunas iguais). */
  compacto?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { cores } = useTema();
  const corTexto = selecionado ? cores.sobreDestaque : cores.textoSecundario;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected: !!selecionado }}
      onPress={onPress}
      disabled={!onPress}
      hitSlop={4}
      style={({ pressed }) => [
        estilos.chip,
        {
          backgroundColor: selecionado ? cores.destaque : cores.superficie,
          borderColor: selecionado ? cores.destaque : cores.borda,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text
        numberOfLines={compacto ? 1 : undefined}
        adjustsFontSizeToFit={compacto}
        style={{ color: corTexto, fontSize: compacto ? 14.5 : 15.5, fontWeight: selecionado ? '700' : '400' }}
      >
        {texto}
      </Text>
      {icone && <Feather name={icone} size={15} color={corTexto} style={{ marginLeft: 4 }} />}
    </Pressable>
  );
}

export interface CampoTextoProps extends TextInputProps {
  rotulo?: string;
  erro?: string;
  direita?: React.ReactNode;
  destacarValor?: boolean;
  estiloContainer?: StyleProp<ViewStyle>;
}

export function CampoTexto({
  rotulo,
  erro,
  direita,
  destacarValor,
  estiloContainer,
  style,
  onFocus,
  onBlur,
  ...props
}: CampoTextoProps) {
  const { cores } = useTema();
  const [foco, setFoco] = useState(false);
  return (
    <View style={estiloContainer}>
      {rotulo && <Rotulo>{rotulo}</Rotulo>}
      <View
        style={[
          estilos.campo,
          {
            backgroundColor: cores.superficie,
            borderColor: erro ? cores.perigo : foco ? cores.destaque : cores.borda,
          },
        ]}
      >
        <TextInput
          accessibilityLabel={rotulo}
          placeholderTextColor={cores.textoSecundario}
          selectionColor={cores.destaque}
          onFocus={(e) => {
            setFoco(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFoco(false);
            onBlur?.(e);
          }}
          style={[
            estilos.input,
            { color: destacarValor ? cores.destaqueTexto : cores.texto },
            props.multiline && { minHeight: 110, textAlignVertical: 'top', paddingTop: 16 },
            style,
          ]}
          {...props}
        />
        {direita}
      </View>
      {erro ? (
        <Text accessibilityLiveRegion="polite" style={[estilos.erro, { color: cores.perigo }]}>
          {erro}
        </Text>
      ) : null}
    </View>
  );
}

/** Estrelas somente leitura. */
export function Estrelas({ nota, tamanho = 18 }: { nota: number; tamanho?: number }) {
  const { cores } = useTema();
  return (
    <View
      accessible
      accessibilityLabel={`${nota} de 5 estrelas`}
      style={{ flexDirection: 'row', gap: tamanho * 0.15 }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: tamanho, color: i <= nota ? cores.destaque : cores.estrelaVazia }}>
          ★
        </Text>
      ))}
    </View>
  );
}

/** Seleção da nota geral em estrelas (cada estrela com área de toque ≥ 48 dp). */
export function SeletorEstrelas({ valor, onChange }: { valor: number; onChange: (n: number) => void }) {
  const { cores } = useTema();
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel="Nota geral"
      accessibilityValue={{ min: 1, max: 5, now: valor || undefined, text: valor ? `${valor} de 5 estrelas` : 'sem nota' }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') onChange(Math.min(5, (valor || 0) + 1));
        if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(1, (valor || 1) - 1));
      }}
      style={{ flexDirection: 'row', justifyContent: 'center' }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable
          key={i}
          onPress={() => onChange(i)}
          accessibilityLabel={`${i} ${i === 1 ? 'estrela' : 'estrelas'}`}
          style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 46, lineHeight: 54, color: i <= valor ? cores.destaque : cores.estrelaVazia }}>
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Cabeçalho das abas: subtítulo pequeno + título grande com serifa + elemento à direita. */
export function CabecalhoTela({
  subtitulo,
  titulo,
  direita,
}: {
  subtitulo?: string;
  titulo: string;
  direita?: React.ReactNode;
}) {
  return (
    <View style={estilos.cabecalho}>
      <View style={{ flex: 1 }}>
        {subtitulo && <TextoSecundario style={{ fontSize: 16 }}>{subtitulo}</TextoSecundario>}
        <Titulo tamanho={40}>{titulo}</Titulo>
      </View>
      {direita}
    </View>
  );
}

export function EstadoVazio({ titulo, texto, icone = 'coffee' }: { titulo: string; texto: string; icone?: keyof typeof Feather.glyphMap }) {
  const { cores } = useTema();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <Feather name={icone} size={44} color={cores.destaque} />
      <Text style={{ color: cores.texto, fontSize: 18, fontWeight: '600', marginTop: 16, textAlign: 'center' }}>
        {titulo}
      </Text>
      <TextoSecundario style={{ textAlign: 'center', marginTop: 6, lineHeight: 20 }}>{texto}</TextoSecundario>
    </View>
  );
}

/** Botão só com ícone (voltar, fechar), com área de toque mínima. */
export function BotaoIcone({
  icone,
  onPress,
  rotulo,
  fundo,
}: {
  icone: keyof typeof Feather.glyphMap;
  onPress: () => void;
  rotulo: string;
  fundo?: string;
}) {
  const { cores } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={onPress}
      hitSlop={8}
      style={{
        width: ALVO_TOQUE,
        height: ALVO_TOQUE,
        borderRadius: ALVO_TOQUE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: fundo,
      }}
    >
      <Feather name={icone} size={24} color={cores.texto} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    minHeight: 58,
    borderRadius: raios.grande,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  linha: { flexDirection: 'row', alignItems: 'center' },
  textoBotao: { fontSize: 18, fontWeight: '700' },
  chip: {
    minHeight: ALVO_TOQUE,
    paddingHorizontal: 18,
    borderRadius: raios.pilula,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  campo: {
    minHeight: 56,
    borderRadius: raios.medio,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, minWidth: 0, fontSize: 17, paddingHorizontal: 16, paddingVertical: 14 },
  erro: { fontSize: 13, marginTop: 6 },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});
