import { z } from 'zod';
import { parseNumero } from '../utils/calculos';

/** Valor de atributo sensorial ou nota geral: inteiro de 1 a 5 (restrição do DER). */
export const nota1a5 = z.number().int().min(1).max(5);

const numeroOpcional = (rotulo: string, max: number) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || (parseNumero(v) != null && parseNumero(v)! > 0), {
      message: `${rotulo} inválida`,
    })
    .refine((v) => v === '' || parseNumero(v)! <= max, { message: `${rotulo} muito alta` });

export const origemSchema = z.object({
  pais: z.string(),
  regiao: z.string(),
  lat: z.number(),
  lon: z.number(),
  continente: z.enum(['Américas', 'África', 'Ásia', 'Oceania']),
});

/** Formulário de degustação em três etapas (RF01–RF05), validado com Zod. */
export const degustacaoFormSchema = z.object({
  // Etapa 1 — O café
  fotoUri: z.string().nullable(),
  nome: z.string().trim().min(1, 'Informe o nome do café').max(80, 'Nome muito longo'),
  torrefacao: z.string().trim().max(80),
  origem: origemSchema.nullable(),
  variedade: z.string().trim().max(60),
  processo: z.string(),
  torra: z.enum(['Clara', 'Média', 'Escura', '']),
  metodo: z.string().min(1, 'Escolha o método de preparo'),
  dose: numeroOpcional('Dose', 1000),
  agua: numeroOpcional('Água', 5000),
  // Etapa 2 — Avaliação sensorial
  notas: z.object({
    aroma: nota1a5,
    acidez: nota1a5,
    corpo: nota1a5,
    docura: nota1a5,
    amargor: nota1a5,
    retrogosto: nota1a5,
  }),
  sabores: z.array(z.string()),
  // Etapa 3 — Veredito
  notaGeral: z
    .number()
    .int()
    .min(1, 'Dê uma nota geral de 1 a 5 estrelas')
    .max(5),
  notasLivres: z.string().max(1000, 'Máximo de 1000 caracteres'),
});

export type DegustacaoForm = z.infer<typeof degustacaoFormSchema>;

export const CAMPOS_ETAPA_1 = ['nome', 'torrefacao', 'variedade', 'metodo', 'dose', 'agua'] as const;
export const CAMPOS_ETAPA_2 = ['notas', 'sabores'] as const;
export const CAMPOS_ETAPA_3 = ['notaGeral', 'notasLivres'] as const;

export const FORM_INICIAL: DegustacaoForm = {
  fotoUri: null,
  nome: '',
  torrefacao: '',
  origem: null,
  variedade: '',
  processo: '',
  torra: '',
  metodo: '',
  dose: '',
  agua: '',
  notas: { aroma: 3, acidez: 3, corpo: 3, docura: 3, amargor: 3, retrogosto: 3 },
  sabores: [],
  notaGeral: 0,
  notasLivres: '',
};
