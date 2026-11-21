/**
 * Processo 4 — Dashboard (Figura 4, RF10): total de cafés, média de notas, país mais frequente,
 * método favorito, radar médio dos últimos 10 cafés e gráfico de barras de cafés por mês.
 */
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GraficoBarras, GraficoRadar } from '../components/Graficos';
import { CabecalhoTela, Cartao, EstadoVazio, TextoSecundario } from '../components/ui';
import { fontes, raios, useTema } from '../theme/TemaContext';
import { formatarNota } from '../utils/calculos';
import { useAuth } from '../viewmodels/useAuth';
import { useDados } from '../viewmodels/DadosContext';
import { useDashboard } from '../viewmodels/useDashboard';

export function DashboardScreen() {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const { perfil } = useAuth();
  const { catalogos } = useDados();
  const vm = useDashboard();
  const { estatisticas: e } = vm;

  return (
    <ScrollView
      style={{ backgroundColor: cores.fundo }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: 32 }}
    >
      <CabecalhoTela subtitulo="Sua evolução" titulo="Dashboard" />

      {vm.carregando ? (
        <ActivityIndicator color={cores.destaque} style={{ marginTop: 40 }} />
      ) : e.total === 0 ? (
        <EstadoVazio
          icone="bar-chart-2"
          titulo="Ainda não há dados"
          texto="Registre suas degustações para acompanhar a evolução do seu paladar."
        />
      ) : (
        <>
          <View style={estilos.grade}>
            <Estatistica rotulo="Cafés">
              <Text style={[estilos.numero, { color: cores.texto }]}>{e.total}</Text>
            </Estatistica>
            <Estatistica rotulo="Média">
              <Text style={[estilos.numero, { color: cores.destaqueTexto }]}>
                {e.mediaNotas != null ? formatarNota(e.mediaNotas, perfil.escalaNotas) : '—'}
                <Text style={{ fontSize: 22, color: cores.textoSecundario }}>
                  {perfil.escalaNotas === '1-10' ? ' /10' : ' ★'}
                </Text>
              </Text>
            </Estatistica>
            <Estatistica rotulo="País + frequente">
              <Text numberOfLines={1} style={[estilos.valor, { color: cores.texto }]}>
                {e.paisMaisFrequente ? `${e.paisMaisFrequente.nome} · ${e.paisMaisFrequente.qtd}` : '—'}
              </Text>
            </Estatistica>
            <Estatistica rotulo="Método favorito">
              <Text numberOfLines={1} style={[estilos.valor, { color: cores.texto }]}>
                {e.metodoFavorito ? `${e.metodoFavorito.nome} · ${e.metodoFavorito.qtd}` : '—'}
              </Text>
            </Estatistica>
          </View>

          {vm.radar && (
            <Cartao style={{ marginBottom: 14 }}>
              <View style={estilos.tituloCartao}>
                <Text style={[estilos.tituloTexto, { color: cores.texto }]}>Paladar médio</Text>
                <TextoSecundario style={{ fontSize: 15 }}>
                  {vm.qtdRadar === 1 ? 'último café' : `últimos ${vm.qtdRadar} cafés`}
                </TextoSecundario>
              </View>
              <GraficoRadar notas={vm.radar} atributos={catalogos.atributos} tamanho={250} />
            </Cartao>
          )}

          <Cartao>
            <View style={estilos.tituloCartao}>
              <Text style={[estilos.tituloTexto, { color: cores.texto }]}>Cafés por mês</Text>
              <TextoSecundario style={{ fontSize: 15 }}>{vm.ano}</TextoSecundario>
            </View>
            <GraficoBarras barras={vm.barras} altura={130} />
          </Cartao>
        </>
      )}
    </ScrollView>
  );
}

function Estatistica({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  const { cores } = useTema();
  return (
    <View
      accessible
      style={[estilos.estatistica, { backgroundColor: cores.superficie, borderColor: cores.borda }]}
    >
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: cores.textoSecundario, fontSize: 13, letterSpacing: 0.4 }}>
        {rotulo.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  estatistica: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: raios.grande,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  numero: { fontFamily: fontes.titulo, fontWeight: '700', fontSize: 44, marginTop: 2 },
  valor: { fontSize: 21, fontWeight: '700', marginTop: 10 },
  tituloCartao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tituloTexto: { fontSize: 19, fontWeight: '700' },
});
