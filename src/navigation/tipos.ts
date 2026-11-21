import type { NavigatorScreenParams } from '@react-navigation/native';

/** Abas da navegação inferior: quatro destinos (seção 3.1). */
export type AbasParams = {
  Diario: { pais?: string } | undefined;
  Dashboard: undefined;
  Mapa: undefined;
  Config: undefined;
};

/** Pilha do fluxo autenticado: abas + telas de detalhe e cadastro. */
export type PilhaParams = {
  Abas: NavigatorScreenParams<AbasParams> | undefined;
  Detalhe: { id: string };
  NovaDegustacao: { id?: string } | undefined;
  GuiaAtributos: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends PilhaParams {}
  }
}
