import { ATRIBUTOS_ORDEM, Cafe, Degustacao } from '../models/tipos';
import { calcularRazao } from './calculos';
import { formatarDataHora } from './datas';

/** Separador ";" e vírgula decimal: abre direto no Excel/LibreOffice em português. */
const SEP = ';';

export function escaparCelula(valor: string | number | null | undefined): string {
  if (valor == null) return '';
  const texto = typeof valor === 'number' ? String(valor).replace('.', ',') : valor;
  if (/[";\n\r]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

const CABECALHO = [
  'data_hora',
  'cafe',
  'torrefacao',
  'pais',
  'regiao',
  'variedade',
  'processo',
  'torra',
  'metodo',
  'dose_g',
  'agua_ml',
  'razao',
  ...ATRIBUTOS_ORDEM,
  'sabores',
  'nota_geral',
  'notas_livres',
];

/** Gera o histórico em CSV (RF12). Os dados do café vêm da coleção `cafes`, quando disponíveis. */
export function gerarCsv(degustacoes: Degustacao[], cafes: Cafe[]): string {
  const cafesPorId = new Map(cafes.map((c) => [c.id, c]));
  const linhas = degustacoes.map((d) => {
    const cafe = cafesPorId.get(d.cafeId);
    const celulas: (string | number | null)[] = [
      formatarDataHora(d.dataHora),
      d.cafeResumo.nome,
      cafe?.torrefacao ?? '',
      d.cafeResumo.pais,
      d.cafeResumo.regiao,
      cafe?.variedade ?? '',
      cafe?.processo ?? '',
      cafe?.torra ?? '',
      d.metodo,
      d.receita.doseG,
      d.receita.aguaMl,
      calcularRazao(d.receita.doseG, d.receita.aguaMl),
      ...ATRIBUTOS_ORDEM.map((id) => d.notas[id]),
      d.sabores.join(', '),
      d.notaGeral,
      d.notasLivres,
    ];
    return celulas.map(escaparCelula).join(SEP);
  });
  // BOM para o Excel reconhecer UTF-8 (acentos).
  return '﻿' + [CABECALHO.join(SEP), ...linhas].join('\r\n');
}
