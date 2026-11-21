/**
 * Paletas dos temas escuro e claro (seção 3.1 do documento).
 * Escuro: fundo espresso #120E0B, superfícies #1D1713, texto creme #F2E8DA, destaque âmbar #E0963C.
 * Todas as combinações de texto/fundo respeitam o contraste mínimo de 4,5:1 (RNF05).
 */
export interface Paleta {
  fundo: string;
  superficie: string;
  superficieElevada: string;
  borda: string;
  texto: string;
  textoSecundario: string;
  /** Preenchimento de botões, chips selecionados, sliders, radar e barras. */
  destaque: string;
  /** Texto sobre o fundo usando a cor de destaque (links, valores). */
  destaqueTexto: string;
  /** Texto/ícone sobre o preenchimento de destaque. */
  sobreDestaque: string;
  destaqueSuave: string;
  trilha: string;
  perigo: string;
  bordaPerigo: string;
  estrelaVazia: string;
  barraInativa: string;
  sombra: string;
  polegar: string;
  bordaPolegar: string;
}

export const temaEscuro: Paleta = {
  fundo: '#120E0B',
  superficie: '#1D1713',
  superficieElevada: '#251D18',
  borda: '#3A2F27',
  texto: '#F2E8DA',
  textoSecundario: '#A89888',
  destaque: '#E0963C',
  destaqueTexto: '#E0963C',
  sobreDestaque: '#1A120C',
  destaqueSuave: 'rgba(224,150,60,0.28)',
  trilha: '#2E241D',
  perigo: '#E07A5F',
  bordaPerigo: '#5A2E24',
  estrelaVazia: '#4A3D33',
  barraInativa: '#5C4430',
  sombra: '#000000',
  polegar: '#EFE3D3',
  bordaPolegar: '#5A3A1F',
};

export const temaClaro: Paleta = {
  fundo: '#F7F0E6',
  superficie: '#FFFBF5',
  superficieElevada: '#F0E5D6',
  borda: '#DCCDBA',
  texto: '#241A13',
  textoSecundario: '#6B5A4B',
  destaque: '#E0963C',
  destaqueTexto: '#8F4E0E',
  sobreDestaque: '#1A120C',
  destaqueSuave: 'rgba(224,150,60,0.30)',
  trilha: '#E6D8C6',
  perigo: '#B3412A',
  bordaPerigo: '#E5B8AC',
  estrelaVazia: '#D5C6B4',
  barraInativa: '#CDB59A',
  sombra: '#5A3A1A',
  polegar: '#FFFBF5',
  bordaPolegar: '#B8732A',
};

/** Cores dos quadrados de miniatura quando não há foto (variam pelo nome do café). */
export const coresMiniatura: [string, string][] = [
  ['#6B4527', '#3A2516'],
  ['#3E5233', '#202B1A'],
  ['#6E2E28', '#3A1714'],
  ['#5E5030', '#2F2817'],
  ['#4A3A5C', '#241C2E'],
];
