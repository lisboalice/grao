/**
 * catalogoRepository — catálogos de apoio (origens, métodos, atributos e famílias de sabor).
 * Ficam em coleções de raiz, somente leitura, carregadas por script administrativo
 * (scripts/seed-catalogos.ts). Se o Firestore ainda não tiver os catálogos ou não responder,
 * o app usa a cópia embutida em src/catalogos (mesmos arquivos usados pelo script).
 */
import atributosJson from '../catalogos/atributos.json';
import familiasJson from '../catalogos/familias.json';
import metodosJson from '../catalogos/metodos.json';
import origensJson from '../catalogos/origens.json';
import { AtributoSensorial, FamiliaSabor, MetodoPreparo, Origem } from '../models/tipos';
import { collection, db, getDocs } from '../services/firebase';

export interface Catalogos {
  origens: Origem[];
  metodos: MetodoPreparo[];
  atributos: AtributoSensorial[];
  familias: FamiliaSabor[];
}

export const CATALOGOS_EMBUTIDOS: Catalogos = {
  origens: origensJson as Origem[],
  metodos: metodosJson as MetodoPreparo[],
  atributos: (atributosJson as AtributoSensorial[]).sort((a, b) => a.ordem - b.ordem),
  familias: familiasJson as FamiliaSabor[],
};

const TEMPO_LIMITE_MS = 5000;

async function lerColecao<T>(nome: string, reserva: T[]): Promise<T[]> {
  try {
    const consulta = getDocs(collection(db, nome));
    const limite = new Promise<null>((resolve) => setTimeout(() => resolve(null), TEMPO_LIMITE_MS));
    const snap = await Promise.race([consulta, limite]);
    if (!snap || snap.empty) return reserva;
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
  } catch {
    return reserva;
  }
}

export const catalogoRepository = {
  async carregar(): Promise<Catalogos> {
    const [origens, metodos, atributos, familias] = await Promise.all([
      lerColecao<Origem>('origens', CATALOGOS_EMBUTIDOS.origens),
      lerColecao<MetodoPreparo>('metodos', CATALOGOS_EMBUTIDOS.metodos),
      lerColecao<AtributoSensorial>('atributos', CATALOGOS_EMBUTIDOS.atributos),
      lerColecao<FamiliaSabor>('familias', CATALOGOS_EMBUTIDOS.familias),
    ]);
    return {
      origens: [...origens].sort((a, b) => a.pais.localeCompare(b.pais) || a.regiao.localeCompare(b.regiao)),
      metodos,
      atributos: [...atributos].sort((a, b) => a.ordem - b.ordem),
      familias,
    };
  },
};
