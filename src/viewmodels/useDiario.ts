/**
 * ViewModels do diário (RF06, RF07) e do detalhe (RF08, RF09).
 */
import { useEffect, useMemo, useState } from 'react';
import { Cafe, Degustacao } from '../models/tipos';
import { degustacaoRepository } from '../repositories/degustacaoRepository';
import {
  FILTROS_VAZIOS,
  FiltrosDiario,
  filtrarDegustacoes,
  haFiltrosAtivos,
} from '../utils/calculos';
import { useUid } from './useAuth';
import { useDados } from './DadosContext';

export function useDiario() {
  const { degustacoes, carregando, erro } = useDados();
  const [filtros, setFiltros] = useState<FiltrosDiario>(FILTROS_VAZIOS);

  const lista = useMemo(() => filtrarDegustacoes(degustacoes, filtros), [degustacoes, filtros]);

  /** Opções dos chips de filtro, a partir do que o usuário já provou. */
  const paises = useMemo(
    () => [...new Set(degustacoes.map((d) => d.cafeResumo.pais).filter(Boolean))].sort(),
    [degustacoes],
  );
  const metodos = useMemo(
    () => [...new Set(degustacoes.map((d) => d.metodo).filter(Boolean))].sort(),
    [degustacoes],
  );

  return {
    lista,
    total: degustacoes.length,
    carregando,
    erro,
    filtros,
    filtrosAtivos: haFiltrosAtivos(filtros),
    paises,
    metodos,
    setBusca: (busca: string) => setFiltros((f) => ({ ...f, busca })),
    setPais: (pais: string | null) => setFiltros((f) => ({ ...f, pais })),
    setMetodo: (metodo: string | null) => setFiltros((f) => ({ ...f, metodo })),
    setNotaMinima: (notaMinima: number | null) => setFiltros((f) => ({ ...f, notaMinima })),
    limparFiltros: () => setFiltros(FILTROS_VAZIOS),
  };
}

export function useDetalheDegustacao(id: string) {
  const uid = useUid();
  const [degustacao, setDegustacao] = useState<Degustacao | null | undefined>(undefined);
  const [cafe, setCafe] = useState<Cafe | null>(null);

  useEffect(() => degustacaoRepository.observarUma(uid, id, setDegustacao), [uid, id]);

  const cafeId = degustacao?.cafeId;
  useEffect(() => {
    if (!cafeId) return;
    return degustacaoRepository.observarCafe(uid, cafeId, setCafe);
  }, [uid, cafeId]);

  return {
    /** undefined = carregando; null = não existe (ex.: acabou de ser excluída). */
    degustacao,
    cafe,
    excluir: () => (degustacao ? degustacaoRepository.excluir(uid, degustacao) : Promise.resolve()),
  };
}
