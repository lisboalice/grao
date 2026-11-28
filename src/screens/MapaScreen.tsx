/**
 * Processo 4 — Mapa de origens (Figura 4, RF11).
 * Mapa-múndi (MapLibre + tiles do OpenStreetMap) com marcadores por país cujo tamanho indica a
 * quantidade de cafés; filtro por continente; ao tocar num marcador, um bottom sheet lista os
 * cafés daquela origem e cada item abre o detalhe. Os tiles exigem conexão (RNF03).
 */
import { Feather } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '../components/Folhas';
import { MapaOrigens } from '../components/MapaOrigens';
import { Miniatura, uriDaFoto } from '../components/Miniatura';
import { CabecalhoTela, Chip, Estrelas } from '../components/ui';
import { AbasParams, PilhaParams } from '../navigation/tipos';
import { raios, useTema } from '../theme/TemaContext';
import { formatarNota } from '../utils/calculos';
import { useAuth } from '../viewmodels/useAuth';
import { useDados } from '../viewmodels/DadosContext';
import { FILTROS_CONTINENTE, useMapa } from '../viewmodels/useMapa';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AbasParams, 'Mapa'>,
  NativeStackScreenProps<PilhaParams>
>;

const ITENS_NO_PAINEL = 2;

const DO_CONTINENTE: Record<string, string> = {
  Américas: 'das Américas',
  África: 'da África',
  Ásia: 'da Ásia',
  Oceania: 'da Oceania',
};

export function MapaScreen({ navigation }: Props) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const { perfil } = useAuth();
  const { online } = useDados();
  const vm = useMapa();

  const sel = vm.selecionado;

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 24 }}>
        <CabecalhoTela subtitulo="Origens provadas" titulo="Mapa" />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTROS_CONTINENTE}
          keyExtractor={(c) => c}
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={{ gap: 10, paddingBottom: 16, paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <Chip texto={item} selecionado={vm.continente === item} onPress={() => vm.setContinente(item)} />
          )}
        />
      </View>

      <View style={[estilos.cartaoMapa, { borderColor: cores.borda, backgroundColor: cores.superficie }]}>
        <MapaOrigens
          grupos={vm.grupos}
          maximo={vm.maximo}
          limites={vm.limites}
          paisSelecionado={sel?.pais ?? null}
          onSelecionar={vm.selecionar}
          onFechar={vm.fechar}
        />

        {!online && (
          <View style={[estilos.avisoMapa, { backgroundColor: cores.superficieElevada }]}>
            <Feather name="cloud-off" size={14} color={cores.textoSecundario} />
            <Text style={{ color: cores.textoSecundario, marginLeft: 6, fontSize: 13 }}>
              Sem conexão: o mapa precisa de internet
            </Text>
          </View>
        )}
        {vm.grupos.length === 0 && (
          <View pointerEvents="none" style={[estilos.vazio, { backgroundColor: cores.superficieElevada }]}>
            <Text style={{ color: cores.textoSecundario, textAlign: 'center' }}>
              {vm.continente === 'Todos'
                ? 'Informe a origem ao registrar um café para vê-lo no mapa.'
                : `Nenhum café provado ${DO_CONTINENTE[vm.continente]} ainda.`}
            </Text>
          </View>
        )}
      </View>

      <BottomSheet
        visivel={!!sel}
        titulo={sel?.pais ?? ''}
        subtitulo={
          sel
            ? `${sel.qtd} ${sel.qtd === 1 ? 'café' : 'cafés'} · média ${formatarNota(sel.media, perfil.escalaNotas)}${perfil.escalaNotas === '1-10' ? '/10' : ' ★'}`
            : undefined
        }
        onFechar={vm.fechar}
      >
        {sel?.degustacoes.slice(0, ITENS_NO_PAINEL).map((d) => (
          <Pressable
            key={d.id}
            accessibilityRole="button"
            accessibilityLabel={`${d.cafeResumo.nome}, ${d.notaGeral} estrelas`}
            onPress={() => navigation.navigate('Detalhe', { id: d.id })}
            style={({ pressed }) => [
              estilos.itemSheet,
              { borderColor: cores.borda, backgroundColor: cores.fundo, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Miniatura uri={uriDaFoto(d)} nome={d.cafeResumo.nome} tamanho={64} raio={16} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text numberOfLines={1} style={{ color: cores.texto, fontSize: 18, fontWeight: '700' }}>
                {d.cafeResumo.nome}
              </Text>
              <Text numberOfLines={1} style={{ color: cores.textoSecundario, fontSize: 15, marginTop: 2 }}>
                {[d.cafeResumo.regiao, d.metodo].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Estrelas nota={d.notaGeral} tamanho={17} />
          </Pressable>
        ))}
        {sel && (
          <Pressable
            accessibilityRole="link"
            onPress={() => {
              const pais = sel.pais;
              vm.fechar();
              navigation.navigate('Diario', { pais });
            }}
            style={estilos.verTodos}
          >
            <Text style={{ color: cores.textoSecundario, fontSize: 16 }}>
              Ver {sel.qtd > 1 ? `todos os ${sel.qtd}` : 'no diário'} →
            </Text>
          </Pressable>
        )}
      </BottomSheet>
    </View>
  );
}

const estilos = StyleSheet.create({
  cartaoMapa: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: raios.grande,
    overflow: 'hidden',
  },
  avisoMapa: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  vazio: { position: 'absolute', left: 20, right: 20, bottom: 40, padding: 14, borderRadius: 14 },
  itemSheet: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: raios.grande,
    padding: 12,
    marginBottom: 10,
  },
  verTodos: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
