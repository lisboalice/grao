/**
 * Processo 1 — Autenticar-se (Figura 1, RF13).
 * E-mail e senha (mostrar/ocultar), Entrar, Criar conta e "Esqueci minha senha".
 * Erros aparecem abaixo do campo correspondente. Após o login, a navegação leva ao Diário.
 */
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao, CampoTexto, TextoSecundario, Titulo } from '../components/ui';
import { mensagemErroAuth } from '../repositories/contaRepository';
import { useTema } from '../theme/TemaContext';
import { useAuth } from '../viewmodels/useAuth';

type Erros = { email?: string; senha?: string; geral?: string };
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen() {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const { entrar, criarConta, recuperarSenha } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [acao, setAcao] = useState<'entrar' | 'criar' | 'recuperar' | null>(null);

  function validar(criando: boolean): boolean {
    const novos: Erros = {};
    if (!email.trim()) novos.email = 'Informe o e-mail.';
    else if (!EMAIL_VALIDO.test(email.trim())) novos.email = 'E-mail inválido.';
    if (!senha) novos.senha = 'Informe a senha.';
    else if (criando && senha.length < 6) novos.senha = 'A senha precisa ter pelo menos 6 caracteres.';
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function executar(tipo: 'entrar' | 'criar') {
    if (!validar(tipo === 'criar')) return;
    setAcao(tipo);
    try {
      if (tipo === 'entrar') await entrar(email, senha);
      else await criarConta(email, senha);
      // O SessaoProvider detecta o login e a navegação troca para o Diário.
    } catch (e) {
      const { campo, mensagem } = mensagemErroAuth(e);
      setErros({ [campo]: mensagem });
      setAcao(null);
    }
  }

  async function esqueciSenha() {
    if (!EMAIL_VALIDO.test(email.trim())) {
      setErros({ email: 'Digite seu e-mail para receber o link de redefinição.' });
      return;
    }
    setAcao('recuperar');
    try {
      await recuperarSenha(email);
      setErros({});
      Alert.alert('Verifique seu e-mail', `Enviamos um link para redefinir a senha para ${email.trim()}.`);
    } catch (e) {
      const { campo, mensagem } = mensagemErroAuth(e);
      setErros({ [campo]: mensagem });
    } finally {
      setAcao(null);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: cores.fundo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          estilos.conteudo,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 },
        ]}
      >
        <LinearGradient
          colors={['#6B4527', '#3A2516']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[estilos.logo, { borderColor: cores.borda }]}
        >
          <Feather name="coffee" size={64} color="#E8B97A" />
        </LinearGradient>
        <Titulo tamanho={46} style={{ textAlign: 'center', marginTop: 28 }}>
          Grão a Grão
        </Titulo>
        <TextoSecundario style={{ textAlign: 'center', fontSize: 17, marginTop: 6, marginBottom: 44 }}>
          Seu diário sensorial de café
        </TextoSecundario>

        <CampoTexto
          rotulo="E-mail"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (erros.email) setErros((e) => ({ ...e, email: undefined }));
          }}
          erro={erros.email}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          estiloContainer={{ marginBottom: 20 }}
        />
        <CampoTexto
          rotulo="Senha"
          value={senha}
          onChangeText={(t) => {
            setSenha(t);
            if (erros.senha) setErros((e) => ({ ...e, senha: undefined }));
          }}
          erro={erros.senha}
          secureTextEntry={!mostrarSenha}
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => executar('entrar')}
          direita={
            <Pressable
              onPress={() => setMostrarSenha((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              style={estilos.olho}
            >
              <Feather name={mostrarSenha ? 'eye-off' : 'eye'} size={20} color={cores.textoSecundario} />
            </Pressable>
          }
        />
        <Pressable
          onPress={esqueciSenha}
          accessibilityRole="link"
          disabled={acao !== null}
          style={estilos.esqueci}
        >
          <Text style={{ color: cores.destaqueTexto, fontSize: 16 }}>
            {acao === 'recuperar' ? 'Enviando...' : 'Esqueci minha senha'}
          </Text>
        </Pressable>

        {erros.geral && (
          <Text accessibilityLiveRegion="polite" style={[estilos.erroGeral, { color: cores.perigo }]}>
            {erros.geral}
          </Text>
        )}

        <Botao
          titulo="Entrar"
          onPress={() => executar('entrar')}
          carregando={acao === 'entrar'}
          desabilitado={acao !== null && acao !== 'entrar'}
        />
        <Botao
          titulo="Criar conta"
          variante="contorno"
          onPress={() => executar('criar')}
          carregando={acao === 'criar'}
          desabilitado={acao !== null && acao !== 'criar'}
          style={{ marginTop: 14 }}
        />

        <TextoSecundario style={{ textAlign: 'center', marginTop: 40, lineHeight: 22, fontSize: 15 }}>
          Seus cafés ficam salvos na sua conta{'\n'}e funcionam mesmo sem internet.
        </TextoSecundario>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  conteudo: { paddingHorizontal: 22, flexGrow: 1 },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 40,
    borderWidth: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  olho: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  esqueci: { alignSelf: 'flex-end', minHeight: 48, justifyContent: 'center', marginBottom: 18 },
  erroGeral: { fontSize: 14, marginBottom: 12, textAlign: 'center' },
});
