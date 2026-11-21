/**
 * Testes das regras de segurança no Firebase Emulator Suite (RNF08).
 * Rodar com: npm run test:regras   (requer Java e firebase-tools)
 */
import { after, before, beforeEach, describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

let env: RulesTestEnvironment;

const degustacaoValida = () => ({
  dataHora: Timestamp.fromDate(new Date(2026, 10, 8, 21, 47)),
  fotoPath: null,
  fotoUrl: null,
  fotoLocalUri: null,
  notaGeral: 4,
  notasLivres: 'Doçura de caramelo',
  receita: { doseG: 18, aguaMl: 288 },
  metodo: 'V60',
  cafeId: 'fazenda-santa-ines--cafe-serra',
  cafeResumo: { nome: 'Fazenda Santa Inês', pais: 'Brasil', regiao: 'Sul de Minas' },
  notas: { aroma: 3, acidez: 2, corpo: 4, docura: 4, amargor: 2, retrogosto: 3 },
  sabores: ['Cacau', 'Frutos secos'],
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-grao-a-grao',
    firestore: { rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8') },
    storage: { rules: readFileSync(resolve(__dirname, '../storage.rules'), 'utf8') },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
});

after(async () => {
  await env.cleanup();
});

describe('degustações', () => {
  it('o dono cria, lê, edita e exclui as próprias degustações', async () => {
    const db = env.authenticatedContext('marina').firestore();
    const r = doc(db, 'users/marina/degustacoes/d1');
    await assertSucceeds(setDoc(r, degustacaoValida()));
    await assertSucceeds(getDoc(r));
    await assertSucceeds(updateDoc(r, { notaGeral: 5 }));
    await assertSucceeds(deleteDoc(r));
  });

  it('outro usuário não lê nem escreve os dados da Marina', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/marina/degustacoes/d1'), degustacaoValida());
    });
    const db = env.authenticatedContext('rafael').firestore();
    await assertFails(getDoc(doc(db, 'users/marina/degustacoes/d1')));
    await assertFails(setDoc(doc(db, 'users/marina/degustacoes/d2'), degustacaoValida()));
    await assertFails(deleteDoc(doc(db, 'users/marina/degustacoes/d1')));
  });

  it('sem login não há acesso', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'users/marina/degustacoes/d1')));
  });

  it('recusa nota geral ou atributo fora de 1 a 5', async () => {
    const db = env.authenticatedContext('marina').firestore();
    await assertFails(setDoc(doc(db, 'users/marina/degustacoes/a'), { ...degustacaoValida(), notaGeral: 0 }));
    await assertFails(setDoc(doc(db, 'users/marina/degustacoes/b'), { ...degustacaoValida(), notaGeral: 6 }));
    await assertFails(
      setDoc(doc(db, 'users/marina/degustacoes/c'), {
        ...degustacaoValida(),
        notas: { ...degustacaoValida().notas, corpo: 7 },
      }),
    );
    await assertFails(setDoc(doc(db, 'users/marina/degustacoes/d'), { ...degustacaoValida(), notaGeral: 4.5 }));
  });

  it('exige nome do café e método', async () => {
    const db = env.authenticatedContext('marina').firestore();
    await assertFails(setDoc(doc(db, 'users/marina/degustacoes/a'), { ...degustacaoValida(), metodo: '' }));
    await assertFails(
      setDoc(doc(db, 'users/marina/degustacoes/b'), {
        ...degustacaoValida(),
        cafeResumo: { nome: '', pais: '', regiao: '' },
      }),
    );
  });

  it('recusa campos desconhecidos', async () => {
    const db = env.authenticatedContext('marina').firestore();
    await assertFails(setDoc(doc(db, 'users/marina/degustacoes/a'), { ...degustacaoValida(), admin: true }));
  });
});

describe('cafés e perfil', () => {
  it('o dono grava o café; nome é obrigatório', async () => {
    const db = env.authenticatedContext('marina').firestore();
    const cafe = {
      nome: 'Fazenda Santa Inês', torrefacao: 'Café Serra', variedade: 'Bourbon Amarelo',
      processo: 'Natural', torra: 'Média',
      origem: { pais: 'Brasil', regiao: 'Sul de Minas', lat: -21.6, lon: -45.4, continente: 'Américas' },
    };
    await assertSucceeds(setDoc(doc(db, 'users/marina/cafes/c1'), cafe));
    await assertFails(setDoc(doc(db, 'users/marina/cafes/c2'), { ...cafe, nome: '' }));
    await assertFails(setDoc(doc(db, 'users/marina/cafes/c3'), { ...cafe, torra: 'Queimada' }));
  });

  it('perfil aceita só tema e escala válidos', async () => {
    const db = env.authenticatedContext('marina').firestore();
    const perfil = doc(db, 'users/marina');
    await assertSucceeds(setDoc(perfil, { nome: 'Marina', email: 'marina@email.com', tema: 'escuro', escalaNotas: '1-5' }));
    await assertSucceeds(setDoc(perfil, { tema: 'claro' }, { merge: true }));
    await assertFails(setDoc(perfil, { tema: 'azul' }, { merge: true }));
    await assertFails(setDoc(perfil, { papel: 'admin' }, { merge: true }));
  });
});

describe('catálogos', () => {
  it('usuários autenticados leem, mas não escrevem', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'origens/br-sul-de-minas'), { pais: 'Brasil', regiao: 'Sul de Minas' });
    });
    const db = env.authenticatedContext('marina').firestore();
    await assertSucceeds(getDoc(doc(db, 'origens/br-sul-de-minas')));
    await assertFails(setDoc(doc(db, 'origens/novo'), { pais: 'X' }));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'origens/br-sul-de-minas')));
  });
});

describe('storage (fotos)', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

  it('o dono envia imagem para a própria pasta', async () => {
    const st = env.authenticatedContext('marina').storage();
    await assertSucceeds(uploadBytes(ref(st, 'users/marina/fotos/d1.jpg'), jpeg, { contentType: 'image/jpeg' }));
  });

  it('recusa pasta de outro usuário e arquivos que não são imagem', async () => {
    const st = env.authenticatedContext('rafael').storage();
    await assertFails(uploadBytes(ref(st, 'users/marina/fotos/d1.jpg'), jpeg, { contentType: 'image/jpeg' }));
    const proprio = env.authenticatedContext('marina').storage();
    await assertFails(uploadBytes(ref(proprio, 'users/marina/fotos/x.txt'), jpeg, { contentType: 'text/plain' }));
  });
});
