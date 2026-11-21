/**
 * degustacaoRepository — acesso a users/{uid}/degustacoes, users/{uid}/cafes e às fotos no Storage.
 *
 * Decisões (Tabela 9 e Figura 7):
 * - Notas (NOTA_ATRIBUTO), sabores (DEGUSTACAO_SABOR) e um resumo do café ficam embutidos na degustação.
 * - O café e a degustação são gravados juntos em um writeBatch: uma única operação atômica (RNF08).
 * - Gravações NÃO são aguardadas pela interface: sem internet, o Firestore guarda no cache local
 *   e sincroniza ao reconectar (RF14). A promessa devolvida só serve para registrar erros.
 * - A foto é enviada depois ao Cloud Storage; o documento é atualizado com fotoPath/fotoUrl.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  writeBatch,
} from '@react-native-firebase/firestore';
import type { DocumentData, Unsubscribe } from '@react-native-firebase/firestore';
import { deleteObject, getDownloadURL, listAll, putFile, ref } from '@react-native-firebase/storage';
import {
  Cafe,
  CafeResumo,
  Degustacao,
  NotasSensoriais,
  Receita,
} from '../models/tipos';
import { db, storage } from '../services/firebase';
import { apagarArquivoLocal, arquivoLocalExiste } from '../services/fotos';
import { gerarIdCafe } from '../utils/calculos';

const colDegustacoes = (uid: string) => collection(db, 'users', uid, 'degustacoes');
const colCafes = (uid: string) => collection(db, 'users', uid, 'cafes');
const caminhoFoto = (uid: string, id: string) => `users/${uid}/fotos/${id}.jpg`;

function paraData(valor: unknown): Date {
  if (valor instanceof Timestamp) return valor.toDate();
  if (valor && typeof (valor as Timestamp).toDate === 'function') return (valor as Timestamp).toDate();
  return new Date();
}

function paraDegustacao(id: string, d: DocumentData): Degustacao {
  return {
    id,
    dataHora: paraData(d.dataHora),
    fotoPath: d.fotoPath ?? null,
    fotoUrl: d.fotoUrl ?? null,
    fotoLocalUri: d.fotoLocalUri ?? null,
    notaGeral: d.notaGeral,
    notasLivres: d.notasLivres ?? '',
    receita: { doseG: d.receita?.doseG ?? null, aguaMl: d.receita?.aguaMl ?? null },
    metodo: d.metodo,
    cafeId: d.cafeId,
    cafeResumo: {
      nome: d.cafeResumo?.nome ?? '',
      pais: d.cafeResumo?.pais ?? '',
      regiao: d.cafeResumo?.regiao ?? '',
    },
    notas: d.notas as NotasSensoriais,
    sabores: d.sabores ?? [],
  };
}

function paraCafe(id: string, d: DocumentData): Cafe {
  return {
    id,
    nome: d.nome ?? '',
    torrefacao: d.torrefacao ?? '',
    variedade: d.variedade ?? '',
    processo: d.processo ?? '',
    torra: d.torra ?? '',
    origem: d.origem ?? null,
  };
}

export interface MetadadosSincronizacao {
  /** Há gravações locais ainda não confirmadas pelo servidor. */
  pendentes: boolean;
  /** Os dados vieram do cache local (sem confirmação do servidor). */
  doCache: boolean;
}

/** Dados para criar ou editar uma degustação. */
export interface EntradaDegustacao {
  id: string;
  dataHora: Date;
  cafe: Omit<Cafe, 'id'>;
  metodo: string;
  receita: Receita;
  notas: NotasSensoriais;
  sabores: string[];
  notaGeral: number;
  notasLivres: string;
  /**
   * Foto escolhida no formulário: uri local nova, a mesma da degustação original ou null (sem foto).
   */
  fotoUri: string | null;
}

/** Envios de foto em andamento (evita enviar a mesma foto duas vezes). */
const enviosEmAndamento = new Set<string>();

export const degustacaoRepository = {
  /** Gera o id antes de salvar, para nomear a foto e permitir gravação offline. */
  novoId(uid: string): string {
    return doc(colDegustacoes(uid)).id;
  },

  /** Listener reativo de todas as degustações, em ordem cronológica decrescente (RF06). */
  observarTodas(
    uid: string,
    aoReceber: (lista: Degustacao[], meta: MetadadosSincronizacao) => void,
    aoFalhar: (erro: Error) => void,
  ): Unsubscribe {
    const q = query(colDegustacoes(uid), orderBy('dataHora', 'desc'));
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) =>
        aoReceber(
          snap.docs.map((d) => paraDegustacao(d.id, d.data())),
          { pendentes: snap.metadata.hasPendingWrites, doCache: snap.metadata.fromCache },
        ),
      aoFalhar,
    );
  },

  observarUma(
    uid: string,
    id: string,
    aoReceber: (degustacao: Degustacao | null) => void,
  ): Unsubscribe {
    return onSnapshot(doc(colDegustacoes(uid), id), (snap) =>
      aoReceber(snap.exists() ? paraDegustacao(snap.id, snap.data()!) : null),
    );
  },

  observarCafe(uid: string, cafeId: string, aoReceber: (cafe: Cafe | null) => void): Unsubscribe {
    return onSnapshot(doc(colCafes(uid), cafeId), (snap) =>
      aoReceber(snap.exists() ? paraCafe(snap.id, snap.data()!) : null),
    );
  },

  async obterUma(uid: string, id: string): Promise<{ degustacao: Degustacao; cafe: Cafe | null } | null> {
    const snap = await getDoc(doc(colDegustacoes(uid), id));
    if (!snap.exists()) return null;
    const degustacao = paraDegustacao(snap.id, snap.data()!);
    const cafeSnap = await getDoc(doc(colCafes(uid), degustacao.cafeId));
    return { degustacao, cafe: cafeSnap.exists() ? paraCafe(cafeSnap.id, cafeSnap.data()!) : null };
  },

  async listarCafes(uid: string): Promise<Cafe[]> {
    const snap = await getDocs(colCafes(uid));
    return snap.docs.map((d) => paraCafe(d.id, d.data()));
  },

  /**
   * Cria ou atualiza a degustação e o café em uma única gravação atômica.
   * `anterior` é a degustação original, quando é uma edição.
   */
  salvar(uid: string, entrada: EntradaDegustacao, anterior: Degustacao | null): Promise<void> {
    const cafeId = gerarIdCafe(entrada.cafe.nome, entrada.cafe.torrefacao);
    const cafeResumo: CafeResumo = {
      nome: entrada.cafe.nome,
      pais: entrada.cafe.origem?.pais ?? '',
      regiao: entrada.cafe.origem?.regiao ?? '',
    };

    // Foto: mantém a já enviada, troca por uma nova (pendente de envio) ou remove.
    const mesmaFoto =
      anterior != null &&
      entrada.fotoUri != null &&
      (entrada.fotoUri === anterior.fotoLocalUri || entrada.fotoUri === anterior.fotoUrl);
    const foto = mesmaFoto
      ? { fotoPath: anterior!.fotoPath, fotoUrl: anterior!.fotoUrl, fotoLocalUri: anterior!.fotoLocalUri }
      : { fotoPath: null, fotoUrl: null, fotoLocalUri: entrada.fotoUri };

    const batch = writeBatch(db);
    batch.set(doc(colCafes(uid), cafeId), entrada.cafe, { merge: true });
    batch.set(doc(colDegustacoes(uid), entrada.id), {
      dataHora: Timestamp.fromDate(entrada.dataHora),
      ...foto,
      notaGeral: entrada.notaGeral,
      notasLivres: entrada.notasLivres,
      receita: entrada.receita,
      metodo: entrada.metodo,
      cafeId,
      cafeResumo,
      notas: entrada.notas,
      sabores: entrada.sabores,
    });
    const confirmacao = batch.commit();

    if (anterior && !mesmaFoto) {
      // A foto antiga foi trocada ou removida: apaga do Storage e do aparelho.
      if (anterior.fotoPath) deleteObject(ref(storage, anterior.fotoPath)).catch(() => undefined);
      apagarArquivoLocal(anterior.fotoLocalUri);
    }
    if (foto.fotoLocalUri && !foto.fotoPath) {
      this.enviarFoto(uid, entrada.id, foto.fotoLocalUri).catch(() => undefined);
    }
    return confirmacao;
  },

  /**
   * Envia a foto ao Cloud Storage e grava o caminho no documento. Sem conexão, falha e é
   * reenviada depois por `sincronizarFotosPendentes` (a cópia local é mantida até lá).
   */
  async enviarFoto(uid: string, id: string, uriLocal: string): Promise<void> {
    if (enviosEmAndamento.has(id) || !arquivoLocalExiste(uriLocal)) return;
    enviosEmAndamento.add(id);
    try {
      const referencia = ref(storage, caminhoFoto(uid, id));
      await putFile(referencia, uriLocal, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(referencia);
      await updateDoc(doc(colDegustacoes(uid), id), {
        fotoPath: caminhoFoto(uid, id),
        fotoUrl: url,
        fotoLocalUri: null,
      });
      apagarArquivoLocal(uriLocal);
    } finally {
      enviosEmAndamento.delete(id);
    }
  },

  /** Reenvia fotos que ficaram só no aparelho (chamado ao abrir o app e ao reconectar). */
  sincronizarFotosPendentes(uid: string, degustacoes: Degustacao[]): void {
    for (const d of degustacoes) {
      if (d.fotoLocalUri && !d.fotoPath && arquivoLocalExiste(d.fotoLocalUri)) {
        this.enviarFoto(uid, d.id, d.fotoLocalUri).catch(() => undefined);
      }
    }
  },

  /** Exclui a degustação e a foto (RF09). O café é mantido, pois pode ter outras degustações. */
  excluir(uid: string, degustacao: Degustacao): Promise<void> {
    const confirmacao = deleteDoc(doc(colDegustacoes(uid), degustacao.id));
    if (degustacao.fotoPath) {
      deleteObject(ref(storage, degustacao.fotoPath)).catch(() => undefined);
    }
    apagarArquivoLocal(degustacao.fotoLocalUri);
    return confirmacao;
  },

  /** Apaga todas as degustações, cafés e fotos do usuário (exclusão de conta — LGPD). Exige conexão. */
  async excluirTudo(uid: string): Promise<void> {
    const [degustacoes, cafes] = await Promise.all([
      getDocs(colDegustacoes(uid)),
      getDocs(colCafes(uid)),
    ]);
    const referencias = [...degustacoes.docs, ...cafes.docs].map((d) => d.ref);
    for (let i = 0; i < referencias.length; i += 400) {
      const batch = writeBatch(db);
      referencias.slice(i, i + 400).forEach((r) => batch.delete(r));
      await batch.commit();
    }
    for (const d of degustacoes.docs) apagarArquivoLocal(d.data().fotoLocalUri);
    const fotos = await listAll(ref(storage, `users/${uid}/fotos`));
    await Promise.all(fotos.items.map((item) => deleteObject(item)));
  },
};
