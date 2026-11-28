/**
 * Processo 3 — Diário (Figura 3, RF06 e RF07).
 * Cartões em ordem cronológica decrescente, busca por nome e filtros combináveis
 * (origem, método, nota mínima). O botão "+" abre o cadastro.
 */
import { Feather } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SeletorOpcoes } from '../components/Folhas';
import { Miniatura, uriDaFoto } from '../components/Miniatura';
import { Botao, CabecalhoTela, CampoTexto, Chip, EstadoVazio, Estrelas } from '../components/ui';
import { Degustacao } from '../models/tipos';
import { AbasParams, PilhaParams } from '../navigation/tipos';
import { ALVO_TOQUE, raios, useTema } from '../theme/TemaContext';
import { formatarDataCurta, saudacao } from '../utils/datas';
import { useDados } from '../viewmodels/DadosContext';
import { useDiario } from '../viewmodels/useDiario';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AbasParams, 'Diario'>,
  NativeStackScreenProps<PilhaParams>
>;

type Seletor = 'origem' | 'metodo' | 'nota' | null;

export function DiarioScreen({ navigation, route }: Props) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const { online, pendentes } = useDados();
  const vm = useDiario();
  const [seletor, setSeletor] = useState<Seletor>(null);

  // Vindo do mapa ("Ver todos"): aplica o filtro de origem.
  const paisParam = route.params?.pais;
  useEffect(() => {
    if (paisParam) {
      vm.limparFiltros();
      vm.setPais(paisParam);
      navigation.setParams({ pais: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paisParam]);

  const { filtros } = vm;
  const semFiltrosDeChip = !filtros.pais && !filtros.metodo && filtros.notaMinima == null;

  const cabecalho = (
    <View>
      <CabecalhoTela
        subtitulo={saudacao()}
        titulo="Meu Diário"
        direita={
          <View style={[estilos.contador, { borderColor: cores.borda, backgroundColor: cores.superficie }]}>
            <Text style={{ color: cores.textoSecundario, fontSize: 16 }}>
              {vm.total} {vm.total === 1 ? 'café' : 'cafés'}
            </Text>
          </View>
        }
      />
      {(!online || pendentes) && (
        <View style={[estilos.aviso, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
          <Feather name={online ? 'upload-cloud' : 'cloud-off'} size={16} color={cores.textoSecundario} />
          <Text style={{ color: cores.textoSecundario, marginLeft: 8, flex: 1 }}>
            {online
              ? 'Sincronizando alterações...'
              : 'Sem internet. Seus registros ficam salvos e serão sincronizados depois.'}
          </Text>
        </View>
      )}
      <CampoTexto
        placeholder="Buscar por nome..."
        accessibilityLabel="Buscar por nome"
        value={filtros.busca}
        onChangeText={vm.setBusca}
        returnKeyType="search"
        clearButtonMode="while-editing"
        direita={<Feather name="search" size={18} color={cores.textoSecundario} style={{ marginRight: 16 }} />}
        estiloContainer={{ marginBottom: 14 }}
      />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={['todos', 'origem', 'metodo', 'nota'] as const}
        keyExtractor={(i) => i}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ gap: 10, paddingBottom: 18, paddingHorizontal: 20 }}
        renderItem={({ item }) => {
          if (item === 'todos')
            return <Chip texto="Todos" selecionado={semFiltrosDeChip} onPress={() => vm.limparFiltros()} />;
          if (item === 'origem')
            return (
              <Chip
                texto={filtros.pais ?? 'Origem'}
                icone="chevron-down"
                selecionado={!!filtros.pais}
                onPress={() => setSeletor('origem')}
              />
            );
          if (item === 'metodo')
            return (
              <Chip
                texto={filtros.metodo ?? 'Método'}
                icone="chevron-down"
                selecionado={!!filtros.metodo}
                onPress={() => setSeletor('metodo')}
              />
            );
          return (
            <Chip
              texto={filtros.notaMinima != null ? `★ ${filtros.notaMinima}${filtros.notaMinima < 5 ? '+' : ''}` : '★ 4+'}
              selecionado={filtros.notaMinima != null}
              onPress={() => setSeletor('nota')}
            />
          );
        }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <FlatList
        data={vm.lista}
        keyExtractor={(d) => d.id}
        ListHeaderComponent={cabecalho}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS !== 'web'}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        renderItem={({ item }) => (
          <CartaoDegustacao degustacao={item} onPress={() => navigation.navigate('Detalhe', { id: item.id })} />
        )}
        ListEmptyComponent={
          vm.carregando ? (
            <ActivityIndicator color={cores.destaque} style={{ marginTop: 40 }} />
          ) : vm.erro ? (
            <EstadoVazio icone="alert-circle" titulo={vm.erro} texto="Verifique a conexão e abra o app novamente." />
          ) : vm.total === 0 ? (
            <EstadoVazio
              titulo="Seu diário está vazio"
              texto="Toque no + para registrar sua primeira degustação."
            />
          ) : (
            <View>
              <EstadoVazio icone="search" titulo="Nenhum café encontrado" texto="Tente outra busca ou limpe os filtros." />
              <Botao titulo="Limpar filtros" variante="contorno" onPress={vm.limparFiltros} />
            </View>
          )
        }
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nova degustação"
        onPress={() => navigation.navigate('NovaDegustacao')}
        style={({ pressed }) => [
          estilos.fab,
          { backgroundColor: cores.destaque, shadowColor: cores.destaque, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Feather name="plus" size={34} color={cores.sobreDestaque} />
      </Pressable>

      <SeletorOpcoes
        visivel={seletor === 'origem'}
        titulo="Filtrar por origem"
        selecionado={filtros.pais}
        opcoes={[{ valor: null, rotulo: 'Todas as origens' }, ...vm.paises.map((p) => ({ valor: p as string | null, rotulo: p }))]}
        onEscolher={vm.setPais}
        onFechar={() => setSeletor(null)}
      />
      <SeletorOpcoes
        visivel={seletor === 'metodo'}
        titulo="Filtrar por método"
        selecionado={filtros.metodo}
        opcoes={[{ valor: null, rotulo: 'Todos os métodos' }, ...vm.metodos.map((m) => ({ valor: m as string | null, rotulo: m }))]}
        onEscolher={vm.setMetodo}
        onFechar={() => setSeletor(null)}
      />
      <SeletorOpcoes
        visivel={seletor === 'nota'}
        titulo="Nota mínima"
        selecionado={filtros.notaMinima}
        opcoes={[
          { valor: null, rotulo: 'Qualquer nota' },
          { valor: 3, rotulo: '★ 3 ou mais' },
          { valor: 4, rotulo: '★ 4 ou mais' },
          { valor: 5, rotulo: '★ 5' },
        ]}
        onEscolher={vm.setNotaMinima}
        onFechar={() => setSeletor(null)}
      />
    </View>
  );
}

const CartaoDegustacao = React.memo(function CartaoDegustacao({
  degustacao: d,
  onPress,
}: {
  degustacao: Degustacao;
  onPress: () => void;
}) {
  const { cores } = useTema();
  const origem = [d.cafeResumo.regiao, d.cafeResumo.pais].filter(Boolean).join(', ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${d.cafeResumo.nome}, ${origem || 'origem não informada'}, ${d.metodo}, ${d.notaGeral} estrelas, ${formatarDataCurta(d.dataHora)}`}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.cartao,
        { backgroundColor: cores.superficie, borderColor: cores.borda, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Miniatura uri={uriDaFoto(d)} nome={d.cafeResumo.nome} tamanho={76} raio={18} />
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text numberOfLines={1} style={[estilos.nome, { color: cores.texto }]}>
          {d.cafeResumo.nome}
        </Text>
        <Text numberOfLines={1} style={{ color: cores.textoSecundario, fontSize: 16, marginTop: 2 }}>
          {[origem, d.metodo].filter(Boolean).join(' · ')}
        </Text>
        <View style={estilos.rodape}>
          <Estrelas nota={d.notaGeral} tamanho={18} />
          <Text style={{ color: cores.textoSecundario, fontSize: 14 }}>{formatarDataCurta(d.dataHora)}</Text>
        </View>
      </View>
    </Pressable>
  );
});

const estilos = StyleSheet.create({
  contador: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: raios.pilula,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 6,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: raios.pequeno,
    padding: 12,
    marginBottom: 14,
  },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: raios.grande,
    padding: 14,
  },
  nome: { fontSize: 19, fontWeight: '700' },
  rodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 72,
    height: 72,
    minWidth: ALVO_TOQUE,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
});
