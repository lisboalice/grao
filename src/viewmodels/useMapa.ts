/**
 * ViewModel do mapa de origens (RF11): marcadores por país, filtro por continente e
 * país selecionado (bottom sheet).
 */
import { useMemo, useState } from 'react';
import { Continente } from '../models/tipos';
import { agruparPorPais } from '../utils/calculos';
import { useDados } from './DadosContext';

export type LimitesMapa = [number, number, number, number];
export type FiltroContinente = 'Todos' | Continente;
export const FILTROS_CONTINENTE: FiltroContinente[] = ['Todos', 'Américas', 'África', 'Ásia', 'Oceania'];

/** Enquadramento do mapa para cada filtro: [oeste, sul, leste, norte]. */
export const LIMITES_CONTINENTE: Record<FiltroContinente, LimitesMapa> = {
  Todos: [-170, -50, 170, 65],
  Américas: [-160, -40, -30, 30],
  África: [-20, -30, 55, 20],
  Ásia: [40, -12, 135, 35],
  Oceania: [110, -45, 180, 10],
};

export function useMapa() {
  const { degustacoes, catalogos } = useDados();
  const [continente, setContinente] = useState<FiltroContinente>('Todos');
  const [paisSelecionado, setPaisSelecionado] = useState<string | null>(null);

  const todos = useMemo(
    () => agruparPorPais(degustacoes, catalogos.origens),
    [degustacoes, catalogos.origens],
  );
  const grupos = useMemo(
    () => (continente === 'Todos' ? todos : todos.filter((g) => g.continente === continente)),
    [todos, continente],
  );
  const maximo = useMemo(() => Math.max(1, ...todos.map((g) => g.qtd)), [todos]);
  const selecionado = grupos.find((g) => g.pais === paisSelecionado) ?? null;

  return {
    grupos,
    maximo,
    continente,
    limites: LIMITES_CONTINENTE[continente],
    selecionado,
    setContinente: (c: FiltroContinente) => {
      setContinente(c);
      setPaisSelecionado(null);
    },
    selecionar: setPaisSelecionado,
    fechar: () => setPaisSelecionado(null),
  };
}
