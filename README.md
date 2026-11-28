# Grão a Grão — diário sensorial de café

Aplicativo móvel (Android e iOS) em **React Native + Expo (development build) + TypeScript**, com
**Firebase** (Authentication, Cloud Firestore com cache offline e Cloud Storage) via **React Native Firebase**.
Implementa os protótipos e as especificações do documento do projeto (seções 1.4, 3.1, 3.2 e 3.3).

## Pré-requisitos

- Node.js 20 ou superior
- Android Studio (emulador ou aparelho, Android 8.0 / API 26 ou superior) e/ou Xcode (iOS)
- Java 17+ (só para rodar os testes das regras no Firebase Emulator Suite)
- Um projeto no [Firebase Console](https://console.firebase.google.com)

> O app usa módulos nativos (React Native Firebase e MapLibre), por isso **não roda no Expo Go**:
> é preciso um *development build* (`npx expo run:android` / `npx expo run:ios` ou `eas build --profile development`).

## Configuração

1. **Dependências**

   ```bash
   npm install
   ```

2. **Firebase**
   - Authentication → Sign-in method → ativar **E-mail/senha**.
   - Firestore Database → criar o banco (modo produção).
   - Storage → ativar (pode exigir o plano Blaze, que tem cota gratuita — configure alertas de orçamento).
   - Configurações do projeto → adicionar app **Android** com o pacote `br.pucminas.graoagrao`
     e baixar o `google-services.json` para a **raiz** do projeto.
   - Adicionar app **iOS** com o bundle ID `br.pucminas.graoagrao` e baixar o
     `GoogleService-Info.plist` para a **raiz** do projeto.

3. **Publicar as regras de segurança**

   ```bash
   npx firebase login
   npx firebase use --add          # escolha o seu projeto
   npx firebase deploy --only firestore:rules,storage
   ```

4. **Carregar os catálogos** (origens, métodos, atributos e famílias de sabor)
   - Firebase Console → Configurações do projeto → Contas de serviço → *Gerar nova chave privada*.
   - Salve como `scripts/service-account.json` (já está no `.gitignore`; nunca versione).
   - `npm run seed`

   Enquanto os catálogos não forem carregados, o app usa a cópia embutida em `src/catalogos/`.

5. **Rodar**

   ```bash
   npx expo run:android     # compila o development build e instala no emulador/aparelho
   npx expo run:ios         # (macOS)
   npm run web              # abre no navegador via Expo Web
   npm start                # depois da primeira compilação, só para recarregar o JS
   ```

## Testes

```bash
npm test               # Jest: cálculos (razão, médias, estatísticas, filtros), datas, CSV e validação Zod
npm run typecheck      # TypeScript
npm run test:regras    # regras do Firestore e do Storage no Firebase Emulator Suite (requer Java)
```

## Arquitetura (MVVM + Repository — Figura 7)

```
App.tsx                         Provedores (tema, sessão) e navegação
src/
  navigation/                   Pilha + abas (Diário, Dashboard, Mapa, Config); login separado
  screens/                      View — telas dos protótipos (Processos 1 a 5)
    nova-degustacao/            Cadastro/edição em três etapas
  components/                   Componentes próprios: slider, radar e barras (react-native-svg), estrelas, chips…
  viewmodels/                   ViewModel (hooks): useAuth, useDiario, useDashboard, useMapa, useDegustacaoForm
                                DadosContext: listener onSnapshot único e reativo das degustações
  repositories/                 degustacaoRepository, catalogoRepository, contaRepository (Firebase)
  services/                     Instâncias do Firebase, fotos (câmera/galeria/compressão), exportação CSV
  models/                       Tipos (DER/Tabela 9) e esquema Zod do formulário
  utils/                        Cálculos puros (testados), datas e CSV
  catalogos/                    JSON dos catálogos (usados pelo seed e como reserva offline)
  theme/                        Paletas escura/clara (contraste ≥ 4,5:1) e tipografia
firestore.rules, storage.rules  Regras de segurança
scripts/seed-catalogos.ts       Carga dos catálogos com o Admin SDK
testes-regras/                  Testes das regras no Emulator
__tests__/                      Testes unitários (Jest)
```

## Onde cada requisito está

| Requisito | Onde |
|---|---|
| RF01–RF05 cadastro em 3 etapas, foto, origem com autocompletar, sliders com tooltip, famílias, estrelas, receita e razão | `screens/nova-degustacao/*`, `viewmodels/useDegustacaoForm.ts`, `components/SliderNota.tsx`, `services/fotos.ts` |
| RF06–RF07 diário, busca e filtros combináveis | `screens/DiarioScreen.tsx`, `viewmodels/useDiario.ts`, `utils/calculos.ts` |
| RF08–RF09 detalhe, radar individual, editar e excluir (com a foto) | `screens/DetalheScreen.tsx`, `repositories/degustacaoRepository.ts` |
| RF10 dashboard | `screens/DashboardScreen.tsx`, `viewmodels/useDashboard.ts`, `components/Graficos.tsx` |
| RF11 mapa com marcadores, filtro por continente e bottom sheet | `screens/MapaScreen.tsx`, `viewmodels/useMapa.ts` |
| RF12 tema claro/escuro e CSV | `screens/ConfigScreen.tsx`, `services/exportacao.ts`, `utils/csv.ts` |
| RF13 conta: entrar, criar, sair, recuperar senha, excluir conta e dados | `screens/LoginScreen.tsx`, `viewmodels/useAuth.tsx`, `repositories/contaRepository.ts` |
| RF14 / RNF03 offline | gravações sem `await` (cache do Firestore), fotos com cópia local reenviada ao reconectar (`DadosContext.tsx`) |
| RNF04 privacidade | `firestore.rules`, `storage.rules`; permissões de câmera/galeria só ao tocar no botão |
| RNF05 acessibilidade | sliders e estrelas "ajustáveis", gráficos com rótulo descritivo, alvos ≥ 48 dp, contraste verificado |
| RNF07 testes | `__tests__/` |
| RNF08 gravação atômica e regras testadas | `writeBatch` em `degustacaoRepository.salvar`, `testes-regras/` |

## Decisões de implementação

- **Lista do diário**: um único listener `onSnapshot` ordenado por data alimenta Diário, Dashboard e Mapa
  (as estatísticas e o mapa precisam de todas as degustações, e a busca por nome é feita no app, já que o
  Firestore não busca por trecho de texto). A lista usa `FlatList` virtualizada e miniaturas.
- **Café × degustação (1:N)**: o id do café é gerado a partir do nome + torrefação, então provar o mesmo
  café de novo reaproveita o mesmo documento em `cafes`.
- **Campos além da Tabela 9**: `fotoUrl` (URL de download, para exibir sem nova consulta), `fotoLocalUri`
  (cópia local até o envio terminar), `cafeResumo.regiao` (para o cartão "Sul de Minas, Brasil") e
  `origem.continente` (filtro do mapa).
- **Escala das notas** (Configurações): muda só a exibição das médias (1–5 ou 1–10); o armazenamento
  continua em 1–5, como no DER.
- **Mapa**: tiles do OpenStreetMap (`tile.openstreetmap.org`), adequados para uso leve e acadêmico, com a
  atribuição exibida. Para uso público em escala, troque por um provedor de tiles próprio.
