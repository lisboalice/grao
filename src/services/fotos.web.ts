/**
 * Câmera/galeria e compressão das fotos para Expo Web (RF02).
 * No navegador, ImagePicker e ImageManipulator operam com URLs blob:/data: em memória
 * até o envio ao Cloud Storage (sem usar expo-file-system).
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const LARGURA_MAXIMA = 1280;
const QUALIDADE = 0.7;

export type OrigemFoto = 'camera' | 'galeria';

export class PermissaoNegadaError extends Error {}

/** Abre o seletor de arquivo (ou captura de câmera no celular via navegador). Retorna null se cancelado. */
export async function escolherFoto(origem: OrigemFoto): Promise<string | null> {
  const opcoes: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  };
  const resultado =
    origem === 'camera'
      ? await ImagePicker.launchCameraAsync(opcoes)
      : await ImagePicker.launchImageLibraryAsync(opcoes);
  if (resultado.canceled || resultado.assets.length === 0) return null;
  return prepararFoto(resultado.assets[0].uri, resultado.assets[0].width);
}

/** Redimensiona e comprime em JPEG retornando a URI pronta para pré-visualização e upload. */
export async function prepararFoto(uriOrigem: string, largura?: number): Promise<string> {
  const contexto = ImageManipulator.manipulate(uriOrigem);
  if (!largura || largura > LARGURA_MAXIMA) contexto.resize({ width: LARGURA_MAXIMA });
  const imagem = await contexto.renderAsync();
  const salvo = await imagem.saveAsync({ compress: QUALIDADE, format: SaveFormat.JPEG });
  return salvo.uri;
}

export function arquivoLocalExiste(uri: string | null | undefined): boolean {
  if (!uri) return false;
  return uri.startsWith('blob:') || uri.startsWith('data:');
}

export function apagarArquivoLocal(uri: string | null | undefined): void {
  if (!uri || !uri.startsWith('blob:') || typeof URL === 'undefined') return;
  try {
    URL.revokeObjectURL(uri);
  } catch {
    // URL já revogada: nada a fazer
  }
}
