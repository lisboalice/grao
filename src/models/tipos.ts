/**
 * Modelos de domínio (seção 3.2 — DER e Tabela 9 — mapeamento para o Firestore).
 */

export type AtributoId = 'aroma' | 'acidez' | 'corpo' | 'docura' | 'amargor' | 'retrogosto';

/** Ordem em que os atributos aparecem nos sliders e no radar (sentido horário a partir do topo). */
export const ATRIBUTOS_ORDEM: AtributoId[] = [
  'aroma',
  'acidez',
  'corpo',
  'docura',
  'amargor',
  'retrogosto',
];

export type NotasSensoriais = Record<AtributoId, number>;

export type Continente = 'Américas' | 'África' | 'Ásia' | 'Oceania';

/** ORIGEM — catálogo `origens` (somente leitura). */
export interface Origem {
  id: string;
  pais: string;
  regiao: string;
  lat: number;
  lon: number;
  continente: Continente;
}

/** Cópia da origem guardada no café (evita uma leitura extra — Tabela 9). */
export type OrigemCafe = Omit<Origem, 'id'>;

/** METODO_PREPARO — catálogo `metodos`. */
export interface MetodoPreparo {
  id: string;
  nome: string;
}

/** ATRIBUTO_SENSORIAL — catálogo `atributos` (Tabela 5). */
export interface AtributoSensorial {
  id: AtributoId;
  nome: string;
  oQueSente: string;
  dica: string;
  ancoraMin: string;
  ancoraMax: string;
  ordem: number;
}

/** FAMILIA_SABOR — catálogo `familias`. */
export interface FamiliaSabor {
  id: string;
  nome: string;
  exemplos: string;
}

export type NivelTorra = 'Clara' | 'Média' | 'Escura';
export const NIVEIS_TORRA: NivelTorra[] = ['Clara', 'Média', 'Escura'];

export const PROCESSOS = [
  'Lavado',
  'Natural',
  'Honey',
  'Cereja descascado',
  'Fermentado',
  'Anaeróbico',
] as const;
export type Processo = (typeof PROCESSOS)[number];

/** CAFE — users/{uid}/cafes/{cafeId}. */
export interface Cafe {
  id: string;
  nome: string;
  torrefacao: string;
  variedade: string;
  processo: string;
  torra: NivelTorra | '';
  origem: OrigemCafe | null;
}

export interface Receita {
  doseG: number | null;
  aguaMl: number | null;
}

/** Dados do café embutidos na degustação para montar o diário sem ler os cafés. */
export interface CafeResumo {
  nome: string;
  pais: string;
  regiao: string;
}

/** DEGUSTACAO — users/{uid}/degustacoes/{id}. NOTA_ATRIBUTO e DEGUSTACAO_SABOR ficam embutidos. */
export interface Degustacao {
  id: string;
  dataHora: Date;
  /** Caminho no Cloud Storage (users/{uid}/fotos/{id}.jpg); null enquanto a foto não foi enviada. */
  fotoPath: string | null;
  fotoUrl: string | null;
  /** Cópia local da foto (só existe no aparelho que a tirou) — mantida até o envio ser concluído (RF02). */
  fotoLocalUri: string | null;
  notaGeral: number;
  notasLivres: string;
  receita: Receita;
  metodo: string;
  cafeId: string;
  cafeResumo: CafeResumo;
  notas: NotasSensoriais;
  sabores: string[];
}

/** USUARIO — users/{uid}. */
export type EscalaNotas = '1-5' | '1-10';

export interface PerfilUsuario {
  nome: string;
  email: string;
  tema: 'escuro' | 'claro';
  escalaNotas: EscalaNotas;
}
