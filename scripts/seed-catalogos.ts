/**
 * Carrega os catálogos (origens, métodos, atributos, famílias) no Firestore com o Admin SDK.
 * Os usuários não podem escrever nessas coleções (regras), só este script administrativo.
 *
 * Uso:
 *   1. Firebase Console > Configurações do projeto > Contas de serviço > Gerar nova chave privada
 *   2. Salve o arquivo como scripts/service-account.json (NÃO versionar — já está no .gitignore)
 *   3. npm run seed
 *
 * Para carregar no emulador: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const raiz = resolve(__dirname, '..');
const lerJson = (arquivo: string) =>
  JSON.parse(readFileSync(resolve(raiz, 'src/catalogos', arquivo), 'utf8')) as { id: string }[];

const chave = resolve(__dirname, 'service-account.json');
if (process.env.FIRESTORE_EMULATOR_HOST) {
  initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'demo-grao-a-grao' });
} else if (existsSync(chave)) {
  initializeApp({ credential: cert(JSON.parse(readFileSync(chave, 'utf8'))) });
} else {
  console.error('Arquivo scripts/service-account.json não encontrado. Veja as instruções no topo do script.');
  process.exit(1);
}

const db = getFirestore();

async function carregar(colecao: string, arquivo: string) {
  const itens = lerJson(arquivo);
  const batch = db.batch();
  for (const { id, ...dados } of itens) batch.set(db.collection(colecao).doc(id), dados);
  await batch.commit();
  console.log(`✓ ${colecao}: ${itens.length} documentos`);
}

(async () => {
  await carregar('origens', 'origens.json');
  await carregar('metodos', 'metodos.json');
  await carregar('atributos', 'atributos.json');
  await carregar('familias', 'familias.json');
  console.log('Catálogos carregados.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
