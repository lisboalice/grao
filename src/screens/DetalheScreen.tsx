/**
 * Processo 3 — Detalhe da degustação (Figura 3, RF08 e RF09).
 * Foto em destaque, dados do café em cartões, radar individual, sabores e notas.
 * Editar reabre o formulário preenchido; Excluir pede confirmação e apaga também a foto.
 */
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GraficoRadar } from '../components/Graficos';
import { uriDaFoto } from '../components/Miniatura';
import { Botao, BotaoIcone, Cartao, Chip, Estrelas, TextoSecundario, Titulo } from '../components/ui';
import { PilhaParams } from '../navigation/tipos';
import { raios, useTema } from '../theme/TemaContext';
import { exibirAlerta } from '../utils/alerta';
import { calcularRazao } from '../utils/calculos';
import { formatarDataLonga } from '../utils/datas';
import { useDados } from '../viewmodels/DadosContext';
import { useDetalheDegustacao } from '../viewmodels/useDiario';

type Props = NativeStackScreenProps<PilhaParams, 'Detalhe'>;

const ALTURA_TOPO = 300;

export function DetalheScreen({ navigation, route }: Props) {
  const { cores, modo } = useTema();
  const insets = useSafeAreaInsets();
  const { catalogos } = useDados();
  const { degustacao: d, cafe, excluir } = useDetalheDegustacao(route.params.id);

  const saiu = useRef(false);
  const sair = React.useCallback(() => {
    if (saiu.current) return;
    saiu.current = true;
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    if (d === null) sair(); // foi excluída (aqui ou em outro aparelho)
  }, [d, sair]);

  if (!d) {
    return (
      <View style={[estilos.centro, { backgroundColor: cores.fundo }]}>
        <ActivityIndicator color={cores.destaque} size="large" />
      </View>
    );
  }

  const foto = uriDaFoto(d);
  const razao = calcularRazao(d.receita.doseG, d.receita.aguaMl);
  const origem = [d.cafeResumo.regiao, d.cafeResumo.pais].filter(Boolean).join(', ');
  const subtitulo = [cafe?.torrefacao, origem, formatarDataLonga(d.dataHora)].filter(Boolean).join(' · ');
  const receita =
    d.receita.doseG != null && d.receita.aguaMl != null
      ? `${String(d.receita.doseG).replace('.', ',')} g · ${String(d.receita.aguaMl).replace('.', ',')} ml`
      : null;

  function confirmarExclusao() {
    exibirAlerta('Excluir degustação?', `"${d!.cafeResumo.nome}" e a foto serão apagados. Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          excluir().catch(() =>
            exibirAlerta('Erro', 'Não foi possível excluir no servidor. Tente novamente com internet.'),
          );
          sair();
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ height: ALTURA_TOPO }}>
          {foto ? (
            <>
              <Image source={{ uri: foto }} style={StyleSheet.absoluteFill} accessibilityLabel={`Foto de ${d.cafeResumo.nome}`} />
              <LinearGradient
                colors={['rgba(0,0,0,0.35)', 'transparent', cores.fundo]}
                locations={[0, 0.6, 1]}
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : (
            <LinearGradient
              colors={[modo === 'escuro' ? '#5A3A22' : '#C9A27A', modo === 'escuro' ? '#3A2516' : '#E6D3BC', cores.fundo]}
              locations={[0, 0.6, 1]}
              style={[StyleSheet.absoluteFill, estilos.centro]}
            >
              <Feather name="coffee" size={140} color="#E8B97A" style={{ marginTop: 20 }} />
            </LinearGradient>
          )}
          <View style={[estilos.voltar, { top: insets.top + 8 }]}>
            <BotaoIcone icone="chevron-left" rotulo="Voltar" onPress={sair} fundo="rgba(0,0,0,0.45)" />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Titulo tamanho={36}>{d.cafeResumo.nome}</Titulo>
          {!!subtitulo && <TextoSecundario style={{ fontSize: 16, marginTop: 6 }}>{subtitulo}</TextoSecundario>}
          <View style={{ marginTop: 10, marginBottom: 18 }}>
            <Estrelas nota={d.notaGeral} tamanho={28} />
          </View>

          <View style={estilos.linhaCartoes}>
            <CartaoInfo rotulo="Torra" valor={cafe?.torra || '—'} />
            <CartaoInfo rotulo="Processo" valor={cafe?.processo || '—'} />
            <CartaoInfo rotulo={razao ? `${d.metodo} · Razão` : 'Método'} valor={razao ?? d.metodo} />
          </View>
          {(cafe?.variedade || receita) && (
            <TextoSecundario style={{ marginBottom: 14, fontSize: 15, lineHeight: 22 }}>
              {[cafe?.variedade && `Variedade: ${cafe.variedade}`, receita && `Receita: ${receita}`]
                .filter(Boolean)
                .join('\n')}
            </TextoSecundario>
          )}

          <Cartao style={{ marginBottom: 18, paddingVertical: 20 }}>
            <GraficoRadar notas={d.notas} atributos={catalogos.atributos} tamanho={250} />
          </Cartao>

          {d.sabores.length > 0 && (
            <View style={estilos.chips}>
              {d.sabores.map((s) => (
                <Chip key={s} texto={s} selecionado />
              ))}
            </View>
          )}

          {!!d.notasLivres && (
            <Text style={{ color: cores.textoSecundario, fontSize: 17, lineHeight: 25 }}>“{d.notasLivres}”</Text>
          )}
        </View>
      </ScrollView>

      <View style={[estilos.acoes, { paddingBottom: insets.bottom + 14 }]}>
        <Botao titulo="Editar" onPress={() => navigation.navigate('NovaDegustacao', { id: d.id })} style={{ flex: 1 }} />
        <Botao titulo="Excluir" variante="perigo" onPress={confirmarExclusao} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function CartaoInfo({ rotulo, valor }: { rotulo: string; valor: string }) {
  const { cores } = useTema();
  return (
    <View style={[estilos.info, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: cores.textoSecundario, fontSize: 12, letterSpacing: 0.3 }}>
        {rotulo.toUpperCase()}
      </Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: cores.texto, fontSize: 19, fontWeight: '700', marginTop: 2 }}>
        {valor}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  voltar: { position: 'absolute', left: 16, zIndex: 2 },
  linhaCartoes: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  info: { flex: 1, borderWidth: 1, borderRadius: raios.grande, paddingHorizontal: 12, paddingVertical: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  acoes: { flexDirection: 'row', gap: 14, paddingHorizontal: 20, paddingTop: 10 },
});
