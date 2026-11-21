/**
 * Processo 5 — Configurar a conta e exportar dados (Figura 5, RF12 e RF13).
 * Conta (e-mail, sincronização, sair), tema escuro/claro, escala das notas, exportação CSV,
 * exclusão de conta e dados (LGPD), guia dos atributos e versão do app.
 */
import { Feather } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao, CampoTexto, Rotulo, Titulo } from '../components/ui';
import { AbasParams, PilhaParams } from '../navigation/tipos';
import { mensagemErroAuth } from '../repositories/contaRepository';
import { exportarHistoricoCsv } from '../services/exportacao';
import { raios, useTema } from '../theme/TemaContext';
import { useAuth } from '../viewmodels/useAuth';
import { useDados } from '../viewmodels/DadosContext';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AbasParams, 'Config'>,
  NativeStackScreenProps<PilhaParams>
>;

export function ConfigScreen({ navigation }: Props) {
  const { cores, modo } = useTema();
  const insets = useSafeAreaInsets();
  const { usuario, perfil, sair, atualizarPreferencias } = useAuth();
  const { degustacoes, online, pendentes } = useDados();
  const [exportando, setExportando] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);

  const email = usuario?.email ?? perfil.email;
  const statusSync = !online
    ? { icone: 'cloud-off' as const, texto: 'Offline · será sincronizado depois' }
    : pendentes
      ? { icone: 'upload-cloud' as const, texto: 'Sincronizando...' }
      : { icone: 'cloud' as const, texto: 'Sincronizado agora' };

  function confirmarSair() {
    Alert.alert('Sair da conta?', pendentes ? 'Há alterações ainda não sincronizadas. Conecte-se à internet antes de sair para não perdê-las.' : undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => sair() },
    ]);
  }

  async function exportar() {
    if (degustacoes.length === 0) {
      Alert.alert('Nada para exportar', 'Registre uma degustação primeiro.');
      return;
    }
    setExportando(true);
    try {
      await exportarHistoricoCsv(usuario!.uid, degustacoes);
    } catch (e) {
      Alert.alert('Exportar histórico', (e as Error).message || 'Não foi possível gerar o arquivo.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: 32 }}>
        <Titulo tamanho={40} style={{ marginBottom: 20 }}>
          Configurações
        </Titulo>

        <Rotulo>Conta</Rotulo>
        <View style={[estilos.grupo, estilos.conta, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
          <View style={[estilos.avatar, { backgroundColor: '#B8732A' }]}>
            <Text style={{ color: '#1A120C', fontSize: 24, fontWeight: '800' }}>
              {(email || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginHorizontal: 14 }}>
            <Text numberOfLines={1} style={{ color: cores.texto, fontSize: 18, fontWeight: '700' }}>
              {email}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Feather name={statusSync.icone} size={14} color={cores.textoSecundario} />
              <Text style={{ color: cores.textoSecundario, fontSize: 15, marginLeft: 6 }}>{statusSync.texto}</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={confirmarSair}
            style={[estilos.pilula, { borderColor: cores.borda }]}
          >
            <Text style={{ color: cores.textoSecundario, fontSize: 16 }}>Sair</Text>
          </Pressable>
        </View>

        <Rotulo>Aparência</Rotulo>
        <View style={[estilos.grupo, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
          <Linha titulo="Tema escuro">
            <Switch
              accessibilityLabel="Tema escuro"
              value={modo === 'escuro'}
              onValueChange={(v) => atualizarPreferencias({ tema: v ? 'escuro' : 'claro' })}
              trackColor={{ true: cores.destaque, false: cores.trilha }}
              thumbColor={modo === 'escuro' ? '#1A120C' : '#FFFFFF'}
              ios_backgroundColor={cores.trilha}
            />
          </Linha>
          <Separador />
          <Linha titulo="Escala das notas">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Escala das notas: ${perfil.escalaNotas === '1-5' ? '1 a 5' : '1 a 10'}. Toque para trocar`}
              onPress={() => atualizarPreferencias({ escalaNotas: perfil.escalaNotas === '1-5' ? '1-10' : '1-5' })}
              style={[estilos.escala, { backgroundColor: cores.destaque }]}
            >
              <Text style={{ color: cores.sobreDestaque, fontWeight: '800', fontSize: 16 }}>
                {perfil.escalaNotas === '1-5' ? '1–5' : '1–10'}
              </Text>
            </Pressable>
          </Linha>
        </View>

        <Rotulo>Dados</Rotulo>
        <View style={[estilos.grupo, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
          <LinhaNavegacao titulo="Exportar histórico (CSV)" onPress={exportar} carregando={exportando} />
          <Separador />
          <LinhaNavegacao titulo="Excluir conta e dados" perigo onPress={() => setModalExcluir(true)} />
        </View>

        <Rotulo>Sobre</Rotulo>
        <View style={[estilos.grupo, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
          <LinhaNavegacao titulo="Guia dos atributos sensoriais" onPress={() => navigation.navigate('GuiaAtributos')} />
          <Separador />
          <Linha titulo="Versão">
            <Text style={{ color: cores.textoSecundario, fontSize: 17 }}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          </Linha>
        </View>
      </ScrollView>

      <ModalExcluirConta visivel={modalExcluir} onFechar={() => setModalExcluir(false)} />
    </View>
  );
}

function Linha({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const { cores } = useTema();
  return (
    <View style={estilos.linha}>
      <Text style={{ color: cores.texto, fontSize: 18 }}>{titulo}</Text>
      {children}
    </View>
  );
}

function LinhaNavegacao({
  titulo,
  onPress,
  perigo,
  carregando,
}: {
  titulo: string;
  onPress: () => void;
  perigo?: boolean;
  carregando?: boolean;
}) {
  const { cores } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={carregando}
      style={({ pressed }) => [estilos.linha, pressed && { opacity: 0.7 }]}
    >
      <Text style={{ color: perigo ? cores.perigo : cores.texto, fontSize: 18 }}>{titulo}</Text>
      {carregando ? (
        <ActivityIndicator color={cores.destaque} />
      ) : (
        <Feather name="chevron-right" size={20} color={cores.textoSecundario} />
      )}
    </Pressable>
  );
}

function Separador() {
  const { cores } = useTema();
  return <View style={{ height: 1, backgroundColor: cores.borda }} />;
}

/** Confirmação da exclusão de conta: o Firebase exige a senha (login recente). */
function ModalExcluirConta({ visivel, onFechar }: { visivel: boolean; onFechar: () => void }) {
  const { cores } = useTema();
  const { excluirContaEDados } = useAuth();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | undefined>();
  const [excluindo, setExcluindo] = useState(false);

  function fechar() {
    setSenha('');
    setErro(undefined);
    onFechar();
  }

  async function confirmar() {
    if (!senha) {
      setErro('Digite sua senha para confirmar.');
      return;
    }
    setExcluindo(true);
    try {
      await excluirContaEDados(senha);
      // A sessão termina e a navegação volta para o login.
    } catch (e) {
      setErro(mensagemErroAuth(e).mensagem);
      setExcluindo(false);
    }
  }

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={fechar}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={estilos.fundoModal}
      >
        <View style={[estilos.modal, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
          <Titulo tamanho={26}>Excluir conta e dados</Titulo>
          <Text style={{ color: cores.textoSecundario, fontSize: 16, lineHeight: 23, marginVertical: 14 }}>
            Todas as suas degustações, cafés e fotos serão apagados permanentemente, junto com a conta.
            Esta ação não pode ser desfeita.
          </Text>
          <CampoTexto
            rotulo="Senha"
            secureTextEntry
            value={senha}
            onChangeText={(t) => {
              setSenha(t);
              setErro(undefined);
            }}
            erro={erro}
            autoCapitalize="none"
          />
          <Botao
            titulo="Excluir definitivamente"
            variante="perigo"
            onPress={confirmar}
            carregando={excluindo}
            style={{ marginTop: 18 }}
          />
          <Botao titulo="Cancelar" variante="contorno" onPress={fechar} desabilitado={excluindo} style={{ marginTop: 10 }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  grupo: { borderWidth: 1, borderRadius: raios.grande, marginBottom: 22, overflow: 'hidden' },
  conta: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  pilula: { minHeight: 44, paddingHorizontal: 18, borderRadius: raios.pilula, borderWidth: 1, justifyContent: 'center' },
  linha: {
    minHeight: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  escala: { minHeight: 40, minWidth: 72, paddingHorizontal: 16, borderRadius: raios.pilula, alignItems: 'center', justifyContent: 'center' },
  fundoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modal: { borderWidth: 1, borderRadius: 26, padding: 22 },
});
