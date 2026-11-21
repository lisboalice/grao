/**
 * Câmera/galeria, compressão e cópia local das fotos (RF02).
 * A foto é redimensionada e comprimida antes do envio, e uma cópia fica na pasta de documentos
 * do app até o upload ao Cloud Storage terminar (assim o cadastro funciona sem internet).
 */
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const LARGURA_MAXIMA = 1280;
const QUALIDADE = 0.7;

export type OrigemFoto = 'camera' | 'galeria';

export class PermissaoNegadaError extends Error {}

/** Abre a câmera ou a galeria, pedindo a permissão só neste momento (RNF04). Retorna null se cancelado. */
export async function escolherFoto(origem: OrigemFoto): Promise<string | null> {
  if (origem === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new PermissaoNegadaError('Permita o acesso à câmera nas configurações.');
  } else {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) throw new PermissaoNegadaError('Permita o acesso às fotos nas configurações.');
  }
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

function pastaFotos(): Directory {
  const pasta = new Directory(Paths.document, 'fotos');
  if (!pasta.exists) pasta.create({ intermediates: true });
  return pasta;
}

/** Redimensiona, comprime em JPEG e copia para a pasta persistente do app. */
export async function prepararFoto(uriOrigem: string, largura?: number): Promise<string> {
  const contexto = ImageManipulator.manipulate(uriOrigem);
  if (!largura || largura > LARGURA_MAXIMA) contexto.resize({ width: LARGURA_MAXIMA });
  const imagem = await contexto.renderAsync();
  const salvo = await imagem.saveAsync({ compress: QUALIDADE, format: SaveFormat.JPEG });
  const destino = new File(pastaFotos(), `foto-${Date.now()}.jpg`);
  new File(salvo.uri).moveSync(destino);
  return destino.uri;
}

export function arquivoLocalExiste(uri: string | null | undefined): boolean {
  if (!uri) return false;
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

export function apagarArquivoLocal(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    const arquivo = new File(uri);
    if (arquivo.exists) arquivo.delete();
  } catch {
    // arquivo já removido ou de outro aparelho: nada a fazer
  }
}
