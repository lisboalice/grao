import type { AlertButton } from 'react-native';

export function exibirAlerta(titulo: string, mensagem?: string, botoes?: AlertButton[]): void {
  const texto = mensagem ? `${titulo}\n\n${mensagem}` : titulo;
  if (!botoes || botoes.length <= 1) {
    window.alert(texto);
    botoes?.[0]?.onPress?.();
    return;
  }
  const acaoPrincipal = botoes.find((b) => b.style !== 'cancel') ?? botoes[botoes.length - 1];
  const acaoCancelar = botoes.find((b) => b.style === 'cancel');
  if (window.confirm(texto)) {
    acaoPrincipal?.onPress?.();
  } else {
    acaoCancelar?.onPress?.();
  }
}
