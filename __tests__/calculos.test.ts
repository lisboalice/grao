/**
 * Testes unitários dos cálculos (RNF07): razão, médias, estatísticas, filtros e agrupamento do mapa.
 */
import origens from '../src/catalogos/origens.json';
import { Degustacao, NotasSensoriais, Origem } from '../src/models/tipos';
import {
  agruparPorPais,
  cafesPorMes,
  calcularEstatisticas,
  calcularRazao,
  filtrarDegustacoes,
  FILTROS_VAZIOS,
  formatarNota,
  gerarIdCafe,
  haFiltrosAtivos,
  mediaSensorial,
  parseNumero,
  radarMedio,
  raioMarcador,
} from '../src/utils/calculos';

const notas = (v: Partial<NotasSensoriais> = {}): NotasSensoriais => ({
  aroma: 3, acidez: 3, corpo: 3, docura: 3, amargor: 3, retrogosto: 3, ...v,
});

let seq = 0;
function deg(p: Partial<Degustacao> & { nome?: string; pais?: string; regiao?: string } = {}): Degustacao {
  seq += 1;
  return {
    id: `d${seq}`,
    dataHora: p.dataHora ?? new Date(2026, 10, 8, 21, 47),
    fotoPath: null,
    fotoUrl: null,
    fotoLocalUri: null,
    notaGeral: p.notaGeral ?? 4,
    notasLivres: '',
    receita: { doseG: 18, aguaMl: 288 },
    metodo: p.metodo ?? 'V60',
    cafeId: 'c',
    cafeResumo: { nome: p.nome ?? 'Fazenda Santa Inês', pais: p.pais ?? 'Brasil', regiao: p.regiao ?? 'Sul de Minas' },
    notas: p.notas ?? notas(),
    sabores: [],
  };
}

describe('parseNumero', () => {
  it('aceita vírgula ou ponto e ignora vazio', () => {
    expect(parseNumero('18')).toBe(18);
    expect(parseNumero('15,5')).toBe(15.5);
    expect(parseNumero(' 2.5 ')).toBe(2.5);
    expect(parseNumero('')).toBeNull();
    expect(parseNumero('abc')).toBeNull();
  });
});

describe('calcularRazao (RF05)', () => {
  it('18 g e 288 ml dá 1:16 (exemplo do protótipo)', () => {
    expect(calcularRazao(18, 288)).toBe('1:16');
  });
  it('usa uma casa decimal com vírgula', () => {
    expect(calcularRazao(15, 250)).toBe('1:16,7');
  });
  it('retorna null sem dose ou água, ou com valores inválidos', () => {
    expect(calcularRazao(null, 250)).toBeNull();
    expect(calcularRazao(18, null)).toBeNull();
    expect(calcularRazao(0, 250)).toBeNull();
    expect(calcularRazao(-1, 250)).toBeNull();
  });
});

describe('mediaSensorial (RF04)', () => {
  it('é a média dos seis atributos (3,0 no protótipo da etapa 3)', () => {
    expect(mediaSensorial(notas({ aroma: 3, acidez: 2, corpo: 4, docura: 4, amargor: 2, retrogosto: 3 }))).toBe(3);
  });
  it('arredonda para uma casa', () => {
    expect(mediaSensorial(notas({ aroma: 5, acidez: 5 }))).toBe(3.7);
  });
});

describe('radarMedio (RF10)', () => {
  it('considera só os últimos 10 cafés', () => {
    const lista = [
      ...Array.from({ length: 10 }, () => deg({ notas: notas({ aroma: 5 }) })),
      ...Array.from({ length: 5 }, () => deg({ notas: notas({ aroma: 1 }) })),
    ];
    expect(radarMedio(lista, 10)!.aroma).toBe(5);
  });
  it('faz a média por atributo', () => {
    const r = radarMedio([deg({ notas: notas({ corpo: 4 }) }), deg({ notas: notas({ corpo: 5 }) })])!;
    expect(r.corpo).toBe(4.5);
    expect(r.aroma).toBe(3);
  });
  it('retorna null sem degustações', () => {
    expect(radarMedio([])).toBeNull();
  });
});

describe('calcularEstatisticas (RF10)', () => {
  it('calcula total, média, país e método mais frequentes', () => {
    const e = calcularEstatisticas([
      deg({ notaGeral: 4, pais: 'Brasil', metodo: 'V60' }),
      deg({ notaGeral: 5, pais: 'Etiópia', metodo: 'Prensa' }),
      deg({ notaGeral: 3, pais: 'Brasil', metodo: 'V60' }),
    ]);
    expect(e.total).toBe(3);
    expect(e.mediaNotas).toBe(4);
    expect(e.paisMaisFrequente).toEqual({ nome: 'Brasil', qtd: 2 });
    expect(e.metodoFavorito).toEqual({ nome: 'V60', qtd: 2 });
  });
  it('lida com lista vazia e origem não informada', () => {
    expect(calcularEstatisticas([])).toEqual({ total: 0, mediaNotas: null, paisMaisFrequente: null, metodoFavorito: null });
    expect(calcularEstatisticas([deg({ pais: '' })]).paisMaisFrequente).toBeNull();
  });
});

describe('cafesPorMes (RF10)', () => {
  it('monta os últimos 6 meses terminando no mês atual', () => {
    const barras = cafesPorMes(
      [deg({ dataHora: new Date(2026, 10, 2) }), deg({ dataHora: new Date(2026, 10, 8) }), deg({ dataHora: new Date(2026, 5, 30) }), deg({ dataHora: new Date(2026, 4, 30) })],
      new Date(2026, 10, 20),
    );
    expect(barras.map((b) => b.rotulo)).toEqual(['Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov']);
    expect(barras.map((b) => b.qtd)).toEqual([1, 0, 0, 0, 0, 2]);
    expect(barras[5].atual).toBe(true);
  });
  it('atravessa a virada do ano', () => {
    const barras = cafesPorMes([deg({ dataHora: new Date(2025, 11, 25) })], new Date(2026, 1, 1));
    expect(barras.map((b) => `${b.rotulo}/${b.ano}`)).toEqual(['Set/2025', 'Out/2025', 'Nov/2025', 'Dez/2025', 'Jan/2026', 'Fev/2026']);
    expect(barras[3].qtd).toBe(1);
  });
});

describe('filtrarDegustacoes (RF07)', () => {
  const lista = [
    deg({ nome: 'Fazenda Santa Inês', pais: 'Brasil', metodo: 'V60', notaGeral: 4 }),
    deg({ nome: 'Kochere Natural', pais: 'Etiópia', metodo: 'Prensa', notaGeral: 5 }),
    deg({ nome: 'Pink Bourbon', pais: 'Colômbia', metodo: 'Espresso', notaGeral: 4 }),
    deg({ nome: 'Tarrazú Honey', pais: 'Costa Rica', metodo: 'Aeropress', notaGeral: 3 }),
  ];
  it('busca por nome sem diferenciar acentos e maiúsculas', () => {
    expect(filtrarDegustacoes(lista, { ...FILTROS_VAZIOS, busca: 'santa ines' })).toHaveLength(1);
    expect(filtrarDegustacoes(lista, { ...FILTROS_VAZIOS, busca: 'TARRAZU' })).toHaveLength(1);
  });
  it('combina origem, método e nota mínima', () => {
    expect(filtrarDegustacoes(lista, { ...FILTROS_VAZIOS, notaMinima: 4 })).toHaveLength(3);
    expect(filtrarDegustacoes(lista, { ...FILTROS_VAZIOS, notaMinima: 4, metodo: 'Espresso' })).toHaveLength(1);
    expect(filtrarDegustacoes(lista, { ...FILTROS_VAZIOS, pais: 'Brasil', notaMinima: 5 })).toHaveLength(0);
  });
  it('sem filtros devolve tudo, na mesma ordem', () => {
    expect(filtrarDegustacoes(lista, FILTROS_VAZIOS)).toEqual(lista);
    expect(haFiltrosAtivos(FILTROS_VAZIOS)).toBe(false);
    expect(haFiltrosAtivos({ ...FILTROS_VAZIOS, busca: ' x ' })).toBe(true);
  });
});

describe('agruparPorPais (RF11)', () => {
  it('agrupa por país com contagem, média e coordenadas do catálogo', () => {
    const grupos = agruparPorPais(
      [
        deg({ pais: 'Etiópia', notaGeral: 5 }),
        deg({ pais: 'Etiópia', notaGeral: 4 }),
        deg({ pais: 'Brasil' }),
        deg({ pais: '' }),
      ],
      origens as Origem[],
    );
    expect(grupos.map((g) => g.pais)).toEqual(['Etiópia', 'Brasil']);
    expect(grupos[0].qtd).toBe(2);
    expect(grupos[0].media).toBe(4.5);
    expect(grupos[0].continente).toBe('África');
    expect(grupos[0].lat).toBeGreaterThan(3);
    expect(grupos[0].lat).toBeLessThan(15);
  });
  it('ignora países sem coordenadas no catálogo', () => {
    expect(agruparPorPais([deg({ pais: 'Atlântida' })], origens as Origem[])).toEqual([]);
  });
  it('o raio do marcador cresce com a quantidade', () => {
    expect(raioMarcador(1, 8)).toBeLessThan(raioMarcador(8, 8));
    expect(raioMarcador(1, 1)).toBe(14);
  });
});

describe('outros', () => {
  it('formatarNota respeita a escala escolhida', () => {
    expect(formatarNota(4.1, '1-5')).toBe('4,1');
    expect(formatarNota(4.1, '1-10')).toBe('8,2');
  });
  it('gerarIdCafe é estável e ignora acentos e caixa', () => {
    expect(gerarIdCafe('Fazenda Santa Inês', 'Café Serra')).toBe('fazenda-santa-ines--cafe-serra');
    expect(gerarIdCafe('FAZENDA santa ines', 'cafe serra')).toBe(gerarIdCafe('Fazenda Santa Inês', 'Café Serra'));
    expect(gerarIdCafe('Kochere', '')).toBe('kochere');
  });
  it('o catálogo de origens tem ids únicos e coordenadas válidas', () => {
    const ids = new Set((origens as Origem[]).map((o) => o.id));
    expect(ids.size).toBe(origens.length);
    for (const o of origens as Origem[]) {
      expect(Math.abs(o.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(o.lon)).toBeLessThanOrEqual(180);
    }
  });
});
