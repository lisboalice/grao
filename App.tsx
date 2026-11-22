import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Navegacao } from './src/navigation/Navegacao';
import { TemaProvider, useTema } from './src/theme/TemaContext';
import { SessaoProvider } from './src/viewmodels/useAuth';

function BarraDeStatus() {
  const { modo } = useTema();
  return <StatusBar style={modo === 'escuro' ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TemaProvider>
        <SessaoProvider>
          <BarraDeStatus />
          <Navegacao />
        </SessaoProvider>
      </TemaProvider>
    </SafeAreaProvider>
  );
}
