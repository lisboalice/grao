/**
 * Processo 2 — Registrar degustação (Figura 2). Formulário em três etapas com barra de progresso.
 * Também é usado para editar (RF09): reabre o formulário preenchido.
 */
import { useFocusEffect, usePreventRemove } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BotaoIcone, Botao, Titulo } from '../../components/ui';
import { PilhaParams } from '../../navigation/tipos';
import { useTema } from '../../theme/TemaContext';
import { useDegustacaoForm } from '../../viewmodels/useDegustacaoForm';
import { Etapa1Cafe } from './Etapa1Cafe';
import { Etapa2Sensorial } from './Etapa2Sensorial';
import { Etapa3Veredito } from './Etapa3Veredito';

type Props = NativeStackScreenProps<PilhaParams, 'NovaDegustacao'>;

const TITULOS_ETAPA = { 1: 'O café', 2: 'Avaliação sensorial', 3: 'Seu veredito' } as const;

export function NovaDegustacaoScreen({ navigation, route }: Props) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const vm = useDegustacaoForm(route.params?.id);
  const [salvo, setSalvo] = useState(false);
  const scrollRef = React.useRef<ScrollViewInstance>(null);

  // Pede confirmação antes de descartar um rascunho com alterações.
  usePreventRemove(vm.form.formState.isDirty && !salvo, ({ data }) => {
    Alert.alert('Descartar alterações?', 'O que você preencheu será perdido.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  // No Android, o botão "voltar" do sistema volta uma etapa antes de sair.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => vm.voltar());
      return () => sub.remove();
    }, [vm]),
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [vm.etapa]);

  useEffect(() => {
    if (salvo) navigation.goBack();
  }, [salvo, navigation]);

  useEffect(() => {
    if (vm.naoEncontrada) {
      Alert.alert('Degustação não encontrada', 'Ela pode ter sido excluída.');
      navigation.goBack();
    }
  }, [vm.naoEncontrada, navigation]);

  function voltar() {
    if (!vm.voltar()) navigation.goBack();
  }

  function principal() {
    if (vm.etapa < 3) {
      vm.avancar();
      return;
    }
    vm.salvar(
      () => setSalvo(true),
      () =>
        Alert.alert(
          'Não foi possível sincronizar',
          'A degustação foi recusada pelo servidor. Verifique os dados e tente novamente.',
        ),
    );
  }

  if (vm.carregando) {
    return (
      <View style={[estilos.centro, { backgroundColor: cores.fundo }]}>
        <ActivityIndicator color={cores.destaque} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: cores.fundo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[estilos.topo, { paddingTop: insets.top + 6 }]}>
        <BotaoIcone icone="chevron-left" rotulo={vm.etapa > 1 ? 'Etapa anterior' : 'Voltar'} onPress={voltar} />
        <Text style={[estilos.tituloTopo, { color: cores.texto }]}>
          {vm.editando ? 'Editar degustação' : 'Nova degustação'}
        </Text>
        <Text
          accessibilityLabel={`Etapa ${vm.etapa} de 3`}
          style={{ color: cores.textoSecundario, fontSize: 16, width: 48, textAlign: 'right' }}
        >
          {vm.etapa}/3
        </Text>
      </View>

      <View style={estilos.progresso} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 3, now: vm.etapa }}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[estilos.segmento, { backgroundColor: i <= vm.etapa ? cores.destaque : cores.trilha }]}
          />
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
      >
        <Titulo tamanho={34} style={{ marginBottom: 18, marginTop: 6 }}>
          {TITULOS_ETAPA[vm.etapa]}
        </Titulo>
        {vm.etapa === 1 && <Etapa1Cafe form={vm.form} razao={vm.razao} />}
        {vm.etapa === 2 && <Etapa2Sensorial form={vm.form} />}
        {vm.etapa === 3 && <Etapa3Veredito form={vm.form} media={vm.media} dataHora={vm.dataHora} />}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 14 }}>
        <Botao
          titulo={vm.etapa < 3 ? 'Continuar' : vm.editando ? 'Salvar alterações' : 'Salvar degustação'}
          icone={vm.etapa < 3 ? 'arrow-right' : undefined}
          onPress={principal}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  tituloTopo: { fontSize: 20, fontWeight: '700' },
  progresso: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 10, marginBottom: 14 },
  segmento: { flex: 1, height: 6, borderRadius: 3 },
});
