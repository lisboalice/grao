/**
 * Navegação (Tabela 10): pilha + abas com quatro destinos (Diário, Dashboard, Mapa, Configurações),
 * separando o fluxo autenticado do login.
 */
import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { DetalheScreen } from '../screens/DetalheScreen';
import { DiarioScreen } from '../screens/DiarioScreen';
import { GuiaAtributosScreen } from '../screens/GuiaAtributosScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MapaScreen } from '../screens/MapaScreen';
import { ConfigScreen } from '../screens/ConfigScreen';
import { NovaDegustacaoScreen } from '../screens/nova-degustacao/NovaDegustacaoScreen';
import { useTema } from '../theme/TemaContext';
import { DadosProvider } from '../viewmodels/DadosContext';
import { useAuth } from '../viewmodels/useAuth';
import { AbasParams, PilhaParams } from './tipos';

const Pilha = createNativeStackNavigator<PilhaParams>();
const Abas = createBottomTabNavigator<AbasParams>();
const PilhaLogin = createNativeStackNavigator();

const ICONES: Record<keyof AbasParams, keyof typeof Feather.glyphMap> = {
  Diario: 'book',
  Dashboard: 'bar-chart-2',
  Mapa: 'map-pin',
  Config: 'settings',
};

const ROTULOS: Record<keyof AbasParams, string> = {
  Diario: 'Diário',
  Dashboard: 'Dashboard',
  Mapa: 'Mapa',
  Config: 'Config',
};

function AbasPrincipais() {
  const { cores } = useTema();
  return (
    <Abas.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: cores.destaqueTexto,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarLabel: ROTULOS[route.name],
        tabBarLabelStyle: { fontSize: 13, marginTop: 2 },
        tabBarStyle: {
          backgroundColor: cores.superficie,
          borderTopColor: cores.borda,
          minHeight: 68,
          paddingTop: 8,
        },
        tabBarIcon: ({ color }) => <Feather name={ICONES[route.name]} size={26} color={color} />,
      })}
    >
      <Abas.Screen name="Diario" component={DiarioScreen} />
      <Abas.Screen name="Dashboard" component={DashboardScreen} />
      <Abas.Screen name="Mapa" component={MapaScreen} />
      <Abas.Screen name="Config" component={ConfigScreen} />
    </Abas.Navigator>
  );
}

function FluxoAutenticado() {
  return (
    <Pilha.Navigator screenOptions={{ headerShown: false }}>
      <Pilha.Screen name="Abas" component={AbasPrincipais} />
      <Pilha.Screen name="Detalhe" component={DetalheScreen} />
      <Pilha.Screen
        name="NovaDegustacao"
        component={NovaDegustacaoScreen}
        options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
      />
      <Pilha.Screen name="GuiaAtributos" component={GuiaAtributosScreen} />
    </Pilha.Navigator>
  );
}

export function Navegacao() {
  const { cores, modo } = useTema();
  const { usuario, iniciando } = useAuth();

  const base = modo === 'escuro' ? DarkTheme : DefaultTheme;
  const tema: Theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: cores.destaque,
      background: cores.fundo,
      card: cores.superficie,
      text: cores.texto,
      border: cores.borda,
    },
  };

  if (iniciando) {
    return (
      <View style={{ flex: 1, backgroundColor: cores.fundo, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={cores.destaque} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={tema}>
      {usuario ? (
        // key: troca de conta recria os listeners do novo usuário
        <DadosProvider key={usuario.uid}>
          <FluxoAutenticado />
        </DadosProvider>
      ) : (
        <PilhaLogin.Navigator screenOptions={{ headerShown: false }}>
          <PilhaLogin.Screen name="Login" component={LoginScreen} />
        </PilhaLogin.Navigator>
      )}
    </NavigationContainer>
  );
}
