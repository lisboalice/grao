/**
 * Exportação do histórico em CSV (RF12): gera o arquivo e abre o compartilhamento do sistema.
 */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
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
  const arquivo = new File(Paths.cache, `grao-a-grao-${hoje}.csv`);
  if (arquivo.exists) arquivo.delete();
  arquivo.create();
  arquivo.write(gerarCsv(degustacoes, cafes));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('O compartilhamento não está disponível neste aparelho.');
  }
  await Sharing.shareAsync(arquivo.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Exportar histórico',
    UTI: 'public.comma-separated-values-text',
  });
}
