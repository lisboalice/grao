import {
  ATRIBUTOS_ORDEM,
  Continente,
  Degustacao,
  NotasSensoriais,
  Origem,
} from '../models/tipos';

/** Converte texto digitado ("18", "15,5") em número; vazio ou inválido vira null. */
export function parseNumero(texto: string | null | undefined): number | null {
  if (texto == null) return null;
  const limpo = String(texto).trim().replace(',', '.');
  if (limpo === '') return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

/** Arredonda para 1 casa decimal sem erros de ponto flutuante visíveis. */
export function arredondar1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Formata número com vírgula decimal (padrão brasileiro): 4.1 → "4,1". */
export function formatarDecimal(n: number, casas = 1): string {
  return n.toFixed(casas).replace('.', ',');
}

/**
 * Razão café:água da receita (RF05). 18 g e 288 ml → "1:16"; 15 g e 250 ml → "1:16,7".
 * Retorna null se faltar dose ou água, ou se forem inválidas.
 */
export function calcularRazao(doseG: number | null, aguaMl: number | null): string | null {
  if (doseG == null || aguaMl == null || doseG <= 0 || aguaMl <= 0) return null;
  const r = arredondar1(aguaMl / doseG);
  const texto = Number.isInteger(r) ? String(r) : formatarDecimal(r);
  return `1:${texto}`;
}

/** Média dos seis atributos — exibida só como referência, nunca preenche a nota geral (RF04). */
export function mediaSensorial(notas: NotasSensoriais): number {
  const soma = ATRIBUTOS_ORDEM.reduce((acc, id) => acc + notas[id], 0);
  return arredondar1(soma / ATRIBUTOS_ORDEM.length);
}

/**
 * Radar médio dos últimos N cafés (RF10). Espera a lista já em ordem cronológica decrescente.
 * Retorna null quando não há degustações.
 */
export function radarMedio(degustacoes: Degustacao[], n = 10): NotasSensoriais | null {
  const ultimas = degustacoes.slice(0, n);
  if (ultimas.length === 0) return null;
  const media = {} as NotasSensoriais;
  for (const id of ATRIBUTOS_ORDEM) {
    const soma = ultimas.reduce((acc, d) => acc + d.notas[id], 0);
    media[id] = arredondar1(soma / ultimas.length);
  }
  return media;
}

export interface Contagem {
  nome: string;
  qtd: number;
}

/** Item mais frequente; empate decidido pelo que aparece primeiro (o mais recente). */
function maisFrequente(valores: string[]): Contagem | null {
  const mapa = new Map<string, number>();
  for (const v of valores) if (v) mapa.set(v, (mapa.get(v) ?? 0) + 1);
  let melhor: Contagem | null = null;
  for (const [nome, qtd] of mapa) if (!melhor || qtd > melhor.qtd) melhor = { nome, qtd };
  return melhor;
}

export interface Estatisticas {
  total: number;
  mediaNotas: number | null;
  paisMaisFrequente: Contagem | null;
  metodoFavorito: Contagem | null;
}

/** Cartões do dashboard (RF10). */
export function calcularEstatisticas(degustacoes: Degustacao[]): Estatisticas {
  const total = degustacoes.length;
  const mediaNotas =
    total === 0 ? null : arredondar1(degustacoes.reduce((a, d) => a + d.notaGeral, 0) / total);
  return {
    total,
    mediaNotas,
    paisMaisFrequente: maisFrequente(degustacoes.map((d) => d.cafeResumo.pais)),
    metodoFavorito: maisFrequente(degustacoes.map((d) => d.metodo)),
  };
}

export const MESES_CURTOS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export interface BarraMes {
  rotulo: string;
  ano: number;
  mes: number; // 0-11
  qtd: number;
  atual: boolean;
}

/** Cafés por mês nos últimos `meses` meses, terminando no mês de referência (RF10). */
export function cafesPorMes(degustacoes: Degustacao[], referencia: Date, meses = 6): BarraMes[] {
  const barras: BarraMes[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(referencia.getFullYear(), referencia.getMonth() - i, 1);
    barras.push({
      rotulo: MESES_CURTOS[d.getMonth()],
      ano: d.getFullYear(),
      mes: d.getMonth(),
      qtd: 0,
      atual: i === 0,
    });
  }
  for (const deg of degustacoes) {
    const barra = barras.find(
      (b) => b.ano === deg.dataHora.getFullYear() && b.mes === deg.dataHora.getMonth(),
    );
    if (barra) barra.qtd += 1;
  }
  return barras;
}

export interface FiltrosDiario {
  busca: string;
  pais: string | null;
  metodo: string | null;
  notaMinima: number | null;
}

export const FILTROS_VAZIOS: FiltrosDiario = { busca: '', pais: null, metodo: null, notaMinima: null };

/** Remove acentos e caixa para a busca por nome. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Busca por nome + filtros de origem, método e nota mínima, combináveis (RF07). */
export function filtrarDegustacoes(lista: Degustacao[], f: FiltrosDiario): Degustacao[] {
  const termo = normalizar(f.busca);
  return lista.filter(
    (d) =>
      (!termo || normalizar(d.cafeResumo.nome).includes(termo)) &&
      (!f.pais || d.cafeResumo.pais === f.pais) &&
      (!f.metodo || d.metodo === f.metodo) &&
      (f.notaMinima == null || d.notaGeral >= f.notaMinima),
  );
}

export function haFiltrosAtivos(f: FiltrosDiario): boolean {
  return !!f.busca.trim() || !!f.pais || !!f.metodo || f.notaMinima != null;
}

export interface GrupoPais {
  pais: string;
  continente: Continente | null;
  lat: number;
  lon: number;
  qtd: number;
  media: number;
  degustacoes: Degustacao[];
}

/**
 * Agrupa as degustações por país para o mapa (RF11). As coordenadas do marcador são a média
 * das regiões daquele país no catálogo de origens. Países sem coordenadas ficam de fora.
 */
export function agruparPorPais(degustacoes: Degustacao[], origens: Origem[]): GrupoPais[] {
  const porPais = new Map<string, Degustacao[]>();
  for (const d of degustacoes) {
    const pais = d.cafeResumo.pais;
    if (!pais) continue;
    porPais.set(pais, [...(porPais.get(pais) ?? []), d]);
  }
  const grupos: GrupoPais[] = [];
  for (const [pais, lista] of porPais) {
    const regioes = origens.filter((o) => o.pais === pais);
    if (regioes.length === 0) continue;
    grupos.push({
      pais,
      continente: regioes[0].continente,
      lat: regioes.reduce((a, o) => a + o.lat, 0) / regioes.length,
      lon: regioes.reduce((a, o) => a + o.lon, 0) / regioes.length,
      qtd: lista.length,
      media: arredondar1(lista.reduce((a, d) => a + d.notaGeral, 0) / lista.length),
      degustacoes: lista,
    });
  }
  return grupos.sort((a, b) => b.qtd - a.qtd);
}

/** Tamanho do marcador do mapa proporcional à quantidade de cafés. */
export function raioMarcador(qtd: number, maximo: number): number {
  const min = 14;
  const max = 30;
  if (maximo <= 1) return min;
  return Math.round(min + ((max - min) * (qtd - 1)) / (maximo - 1));
}

/** Converte a nota (1–5) para a escala escolhida nas configurações. */
export function notaNaEscala(valor: number, escala: '1-5' | '1-10'): number {
  return escala === '1-10' ? valor * 2 : valor;
}

export function formatarNota(valor: number, escala: '1-5' | '1-10'): string {
  return formatarDecimal(notaNaEscala(valor, escala));
}

/** ID estável do café a partir do nome e da torrefação: o mesmo café provado várias vezes (CAFE 1:N DEGUSTACAO). */
export function gerarIdCafe(nome: string, torrefacao: string): string {
  const slug = (s: string) =>
    normalizar(s)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  const partes = [slug(nome), slug(torrefacao)].filter(Boolean);
  return partes.join('--') || 'cafe';
}
