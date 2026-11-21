/**
 * ViewModel do dashboard (RF10): estatísticas, radar médio dos últimos 10 cafés e cafés por mês.
 */
import { useMemo } from 'react';
import { calcularEstatisticas, cafesPorMes, radarMedio } from '../utils/calculos';
import { useDados } from './DadosContext';

export const QTD_RADAR_MEDIO = 10;

export function useDashboard(hoje: Date = new Date()) {
  const { degustacoes, carregando } = useDados();
  const mesReferencia = `${hoje.getFullYear()}-${hoje.getMonth()}`;

  return useMemo(
    () => ({
      carregando,
      estatisticas: calcularEstatisticas(degustacoes),
      radar: radarMedio(degustacoes, QTD_RADAR_MEDIO),
      qtdRadar: Math.min(degustacoes.length, QTD_RADAR_MEDIO),
      barras: cafesPorMes(degustacoes, hoje, 6),
      ano: hoje.getFullYear(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [degustacoes, carregando, mesReferencia],
  );
}
