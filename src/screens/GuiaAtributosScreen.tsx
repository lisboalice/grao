/**
 * Guia dos atributos sensoriais (Configurações > Sobre): Tabela 5 e famílias de sabor (seção 1.4.5).
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BotaoIcone, Cartao, Rotulo, TextoSecundario, Titulo } from '../components/ui';
import { PilhaParams } from '../navigation/tipos';
import { useTema } from '../theme/TemaContext';
import { useDados } from '../viewmodels/DadosContext';

type Props = NativeStackScreenProps<PilhaParams, 'GuiaAtributos'>;

export function GuiaAtributosScreen({ navigation }: Props) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const { catalogos } = useDados();

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 12 }}>
        <BotaoIcone icone="chevron-left" rotulo="Voltar" onPress={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}>
        <Titulo tamanho={34}>Guia dos atributos</Titulo>
        <TextoSecundario style={{ fontSize: 16, lineHeight: 23, marginTop: 8, marginBottom: 20 }}>
          Uma adaptação simplificada do protocolo de degustação da SCA: seis atributos em escala de 1 a 5,
          com dicas do dia a dia. A nota geral é sua — a média dos atributos aparece só como referência.
        </TextoSecundario>

        {catalogos.atributos.map((a) => (
          <Cartao key={a.id} style={{ marginBottom: 12 }}>
            <Text style={[estilos.nome, { color: cores.texto }]}>{a.nome}</Text>
            <Text style={{ color: cores.texto, fontSize: 16, marginTop: 4 }}>{a.oQueSente}</Text>
            <Text style={{ color: cores.textoSecundario, fontSize: 15, marginTop: 4 }}>{a.dica}</Text>
            <View style={estilos.ancoras}>
              <Text style={{ color: cores.textoSecundario }}>1 · {a.ancoraMin}</Text>
              <View style={[estilos.seta, { backgroundColor: cores.destaque }]} />
              <Text style={{ color: cores.destaqueTexto, fontWeight: '700' }}>5 · {a.ancoraMax}</Text>
            </View>
          </Cartao>
        ))}

        <Rotulo style={{ marginTop: 14 }}>Famílias de sabor</Rotulo>
        <Cartao>
          {catalogos.familias.map((f, i) => (
            <View key={f.id} style={{ marginTop: i === 0 ? 0 : 12 }}>
              <Text style={{ color: cores.texto, fontSize: 17, fontWeight: '700' }}>{f.nome}</Text>
              <Text style={{ color: cores.textoSecundario, fontSize: 15, marginTop: 2 }}>{f.exemplos}</Text>
            </View>
          ))}
        </Cartao>
        <TextoSecundario style={{ fontSize: 13, marginTop: 16, lineHeight: 19 }}>
          Famílias inspiradas na Roda de Sabores da SCA e da World Coffee Research (2016).
        </TextoSecundario>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  nome: { fontSize: 20, fontWeight: '700' },
  ancoras: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  seta: { flex: 1, height: 3, borderRadius: 2, marginHorizontal: 10 },
});
