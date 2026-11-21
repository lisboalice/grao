/**
 * ViewModel do cadastro/edição de degustação em três etapas (RF01–RF05, Figura 7 passos 1–4).
 * Valida os campos de cada etapa com Zod antes de avançar e mantém o rascunho no React Hook Form.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  CAMPOS_ETAPA_1,
  CAMPOS_ETAPA_2,
  CAMPOS_ETAPA_3,
  DegustacaoForm,
  degustacaoFormSchema,
  FORM_INICIAL,
} from '../models/esquemas';
import { Cafe, Degustacao, NivelTorra } from '../models/tipos';
import { degustacaoRepository, EntradaDegustacao } from '../repositories/degustacaoRepository';
import { arquivoLocalExiste } from '../services/fotos';
import { calcularRazao, mediaSensorial, parseNumero } from '../utils/calculos';
import { useUid } from './useAuth';
import { useDados } from './DadosContext';

export type Etapa = 1 | 2 | 3;
const CAMPOS_POR_ETAPA = { 1: CAMPOS_ETAPA_1, 2: CAMPOS_ETAPA_2, 3: CAMPOS_ETAPA_3 } as const;

function paraFormulario(d: Degustacao, cafe: Cafe | null, origemCatalogo: Cafe['origem']): DegustacaoForm {
  return {
    fotoUri: arquivoLocalExiste(d.fotoLocalUri) ? d.fotoLocalUri : d.fotoUrl,
    nome: cafe?.nome ?? d.cafeResumo.nome,
    torrefacao: cafe?.torrefacao ?? '',
    origem: cafe?.origem ?? origemCatalogo,
    variedade: cafe?.variedade ?? '',
    processo: cafe?.processo ?? '',
    torra: (cafe?.torra ?? '') as NivelTorra | '',
    metodo: d.metodo,
    dose: d.receita.doseG != null ? String(d.receita.doseG).replace('.', ',') : '',
    agua: d.receita.aguaMl != null ? String(d.receita.aguaMl).replace('.', ',') : '',
    notas: d.notas,
    sabores: d.sabores,
    notaGeral: d.notaGeral,
    notasLivres: d.notasLivres,
  };
}

function paraEntrada(id: string, dataHora: Date, v: DegustacaoForm): EntradaDegustacao {
  return {
    id,
    dataHora,
    cafe: {
      nome: v.nome.trim(),
      torrefacao: v.torrefacao.trim(),
      variedade: v.variedade.trim(),
      processo: v.processo,
      torra: v.torra,
      origem: v.origem,
    },
    metodo: v.metodo,
    receita: { doseG: parseNumero(v.dose), aguaMl: parseNumero(v.agua) },
    notas: v.notas,
    sabores: v.sabores,
    notaGeral: v.notaGeral,
    notasLivres: v.notasLivres.trim(),
    fotoUri: v.fotoUri,
  };
}

export function useDegustacaoForm(idEdicao?: string) {
  const uid = useUid();
  const { catalogos } = useDados();
  const [id] = useState(() => idEdicao ?? degustacaoRepository.novoId(uid));
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [anterior, setAnterior] = useState<Degustacao | null>(null);
  const [carregando, setCarregando] = useState(!!idEdicao);
  const [naoEncontrada, setNaoEncontrada] = useState(false);

  const form = useForm<DegustacaoForm>({
    resolver: zodResolver(degustacaoFormSchema),
    defaultValues: FORM_INICIAL,
    mode: 'onTouched',
  });

  useEffect(() => {
    if (!idEdicao) return;
    degustacaoRepository
      .obterUma(uid, idEdicao)
      .then((res) => {
        if (!res) {
          setNaoEncontrada(true);
          return;
        }
        const reg = catalogos.origens.find(
          (o) => o.pais === res.degustacao.cafeResumo.pais && o.regiao === res.degustacao.cafeResumo.regiao,
        );
        const origemCatalogo = reg
          ? { pais: reg.pais, regiao: reg.regiao, lat: reg.lat, lon: reg.lon, continente: reg.continente }
          : null;
        setAnterior(res.degustacao);
        form.reset(paraFormulario(res.degustacao, res.cafe, origemCatalogo));
      })
      .catch(() => setNaoEncontrada(true))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEdicao, uid]);

  const [dose, agua, notas] = useWatch({ control: form.control, name: ['dose', 'agua', 'notas'] });

  /** Valida só os campos da etapa atual antes de avançar. */
  async function avancar(): Promise<boolean> {
    const ok = await form.trigger([...CAMPOS_POR_ETAPA[etapa]]);
    if (ok && etapa < 3) setEtapa((etapa + 1) as Etapa);
    return ok;
  }

  /** Volta uma etapa. Retorna false na primeira etapa (a tela então sai do formulário). */
  function voltar(): boolean {
    if (etapa === 1) return false;
    setEtapa((etapa - 1) as Etapa);
    return true;
  }

  /**
   * Valida tudo e grava. Não espera o servidor (funciona offline): `aoSalvar` é chamado na hora
   * e `aoFalharSincronizacao` só se o Firestore recusar a gravação depois.
   */
  function salvar(aoSalvar: (id: string) => void, aoFalharSincronizacao: () => void) {
    return form.handleSubmit(
      (valores) => {
        const dataHora = anterior?.dataHora ?? new Date(); // data e hora automáticas (RF05)
        degustacaoRepository
          .salvar(uid, paraEntrada(id, dataHora, valores), anterior)
          .catch(aoFalharSincronizacao);
        aoSalvar(id);
      },
      (erros) => {
        // Se algo da etapa 1 estiver inválido (ex.: edição de registro antigo), volta para lá.
        if (CAMPOS_ETAPA_1.some((c) => c in erros)) setEtapa(1);
      },
    )();
  }

  return {
    form,
    etapa,
    editando: !!idEdicao,
    carregando,
    naoEncontrada,
    dataHora: anterior?.dataHora ?? null,
    razao: calcularRazao(parseNumero(dose), parseNumero(agua)),
    media: mediaSensorial(notas),
    avancar,
    voltar,
    salvar,
  };
}
