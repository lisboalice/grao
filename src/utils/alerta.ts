import { Alert, AlertButton } from 'react-native';

export function exibirAlerta(titulo: string, mensagem?: string, botoes?: AlertButton[]): void {
  Alert.alert(titulo, mensagem, botoes);
}
