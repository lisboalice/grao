/**
 * Testes de datas, CSV e validação do formulário (Zod).
 */
import { DegustacaoForm, degustacaoFormSchema, FORM_INICIAL } from '../src/models/esquemas';
import { Cafe, Degustacao } from '../src/models/tipos';
import { escaparCelula, gerarCsv } from '../src/utils/csv';
import { formatarDataCurta, formatarDataHora, formatarDataLonga, saudacao } from '../src/utils/datas';

describe('datas', () => {
  const agora = new Date(2026, 10, 8, 21, 47);
  it('formata como nos cartões do diário', () => {
    expect(formatarDataCurta(new Date(2026, 10, 8, 20, 15), agora)).toBe('Hoje, 20:15');
    expect(formatarDataCurta(new Date(2026, 10, 7, 22, 40), agora)).toBe('Ontem, 22:40');
    expect(formatarDataCurta(new Date(2026, 10, 5, 8, 10), agora)).toBe('05 nov, 08:10');
    expect(formatarDataCurta(new Date(2025, 11, 31, 9, 0), agora)).toBe('31 dez 2025, 09:00');
  });
  it('"ontem" funciona na virada do mês', () => {
    expect(formatarDataCurta(new Date(2026, 9, 31, 23, 0), new Date(2026, 10, 1, 8, 0))).toBe('Ontem, 23:00');
  });
  it('formata detalhe e data completa', () => {
    expect(formatarDataLonga(agora)).toBe('08 nov 2026');
    expect(formatarDataHora(agora)).toBe('08/11/2026, 21:47');
  });
  it('saudação conforme a hora', () => {
    expect(saudacao(new Date(2026, 0, 1, 7))).toBe('Bom dia');
    expect(saudacao(new Date(2026, 0, 1, 14))).toBe('Boa tarde');
    expect(saudacao(new Date(2026, 0, 1, 21))).toBe('Boa noite');
    expect(saudacao(new Date(2026, 0, 1, 2))).toBe('Boa noite');
  });
});

describe('CSV (RF12)', () => {
  it('escapa aspas, ponto e vírgula e quebras de linha', () => {
    expect(escaparCelula('simples')).toBe('simples');
    expect(escaparCelula('a;b')).toBe('"a;b"');
    expect(escaparCelula('diz "oi"')).toBe('"diz ""oi"""');
    expect(escaparCelula('linha1\nlinha2')).toBe('"linha1\nlinha2"');
    expect(escaparCelula(15.5)).toBe('15,5');
    expect(escaparCelula(null)).toBe('');
  });
  it('gera cabeçalho e uma linha por degustação, juntando os dados do café', () => {
    const d: Degustacao = {
      id: 'x',
      dataHora: new Date(2026, 10, 8, 21, 47),
      fotoPath: null,
      fotoUrl: null,
      fotoLocalUri: null,
      notaGeral: 4,
      notasLivres: 'Doçura de caramelo; corpo cremoso',
      receita: { doseG: 18, aguaMl: 288 },
      metodo: 'V60',
      cafeId: 'c1',
      cafeResumo: { nome: 'Fazenda Santa Inês', pais: 'Brasil', regiao: 'Sul de Minas' },
      notas: { aroma: 3, acidez: 2, corpo: 4, docura: 4, amargor: 2, retrogosto: 3 },
      sabores: ['Cacau', 'Frutos secos'],
    };
    const cafe: Cafe = {
      id: 'c1', nome: 'Fazenda Santa Inês', torrefacao: 'Café Serra', variedade: 'Bourbon Amarelo',
      processo: 'Natural', torra: 'Média', origem: null,
    };
    const linhas = gerarCsv([d], [cafe]).replace('﻿', '').split('\r\n');
    expect(linhas).toHaveLength(2);
    expect(linhas[0].split(';')).toContain('nota_geral');
    expect(linhas[1]).toBe(
      '08/11/2026, 21:47;Fazenda Santa Inês;Café Serra;Brasil;Sul de Minas;Bourbon Amarelo;Natural;Média;V60;18;288;1:16;3;2;4;4;2;3;Cacau, Frutos secos;4;"Doçura de caramelo; corpo cremoso"',
    );
  });
});

describe('validação do formulário (RF01, RF04)', () => {
  const valido: DegustacaoForm = { ...FORM_INICIAL, nome: 'Fazenda Santa Inês', metodo: 'V60', notaGeral: 4 };

  it('aceita um registro mínimo: nome, método e nota geral', () => {
    expect(degustacaoFormSchema.safeParse(valido).success).toBe(true);
  });
  it('exige nome do café, método e nota geral', () => {
    const r = degustacaoFormSchema.safeParse(FORM_INICIAL);
    expect(r.success).toBe(false);
    const campos = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(campos).toEqual(expect.arrayContaining(['nome', 'metodo', 'notaGeral']));
  });
  it('recusa atributo fora da faixa 1–5', () => {
    expect(degustacaoFormSchema.safeParse({ ...valido, notas: { ...valido.notas, corpo: 6 } }).success).toBe(false);
    expect(degustacaoFormSchema.safeParse({ ...valido, notas: { ...valido.notas, corpo: 0 } }).success).toBe(false);
  });
  it('valida dose e água (opcionais, positivas)', () => {
    expect(degustacaoFormSchema.safeParse({ ...valido, dose: '18', agua: '288' }).success).toBe(true);
    expect(degustacaoFormSchema.safeParse({ ...valido, dose: '15,5' }).success).toBe(true);
    expect(degustacaoFormSchema.safeParse({ ...valido, dose: 'abc' }).success).toBe(false);
    expect(degustacaoFormSchema.safeParse({ ...valido, agua: '-10' }).success).toBe(false);
  });
});
