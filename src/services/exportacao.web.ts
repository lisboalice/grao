/**
 * Exportação do histórico em CSV no navegador (RF12): gera o arquivo e dispara o download.
 */
import { Cafe, Degustacao } from '../models/tipos';
import { degustacaoRepository } from '../repositories/degustacaoRepository';
import { gerarCsv } from '../utils/csv';

export async function exportarHistoricoCsv(uid: string, degustacoes: Degustacao[]): Promise<void> {
  let cafes: Cafe[] = [];
  try {
    cafes = await degustacaoRepository.listarCafes(uid);
  } catch {
    // sem os cafés, o CSV sai só com os dados resumidos da degustação
  }
  const hoje = new Date().toISOString().slice(0, 10);
  const csv = '\uFEFF' + gerarCsv(degustacoes, cafes);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `grao-a-grao-${hoje}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
