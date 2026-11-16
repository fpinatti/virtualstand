# Tasks: Mecanismo de Deploy e Execução para Expo Go (Padrão Piupiu U)

**Input**: Design documents from `/specs/008-expo-go-deploy/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/expo-go-deploy-contract.ts](./contracts/expo-go-deploy-contract.ts)

**Tests**: Incluídos conforme especificado em `plan.md` e `SC-001` / `SC-003` para validar a resolução dinâmica do `app.config.js`, a política `runtimeVersion` em `app.json` e os scripts de deploy em `package.json`.

**Organization**: Tarefas agrupadas por história de usuário (`US1`, `US2`) para permitir implementação e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode ser executada em paralelo (arquivos distintos, sem dependências de tarefas incompletas)
- **[Story]**: História de usuário associada (`[US1]`, `[US2]`)
- Caminhos exatos de arquivos incluídos em todas as tarefas

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Criar o arquivo de modelo `.env.example` na raiz do repositório documentando `EAS_PROJECT_ID`, `EXPO_OWNER` e `EXPO_PUBLIC_BGG_API_TOKEN`.

- [x] T001 Create `.env.example` template with `EAS_PROJECT_ID`, `EXPO_OWNER`, and `EXPO_PUBLIC_BGG_API_TOKEN` in `.env.example`

---

## Phase 2: User Story 1 - Configuração Dinâmica de Deploy OTA (`EAS Update`) e Ambiente (Priority: P1) 🎯 MVP

**Goal**: Replicar o mecanismo de deploy OTA (`app.config.js`, `app.json` e scripts `update:preview` / `update:prod` em `package.json`) do projeto `fpinatti/piapiupiu`.

**Independent Test**: Executar `npx jest tests/unit/expo-go-deploy.test.ts` e verificar que `app.config.js` injeta corretamente `owner`, `extra.eas.projectId` e `updates.url` (`https://u.expo.dev/<projectId>`) a partir das variáveis de ambiente.

### Tests for User Story 1

- [x] T002 [P] [US1] Create unit tests validating `app.config.js` dynamic resolution, `.env.example` keys, `app.json` `runtimeVersion` policy, and `package.json` deploy scripts in `tests/unit/expo-go-deploy.test.ts`

### Implementation for User Story 1

- [x] T003 [P] [US1] Create dynamic `app.config.js` with `loadDotEnv()` and `EAS_PROJECT_ID` / `EXPO_OWNER` injection in `app.config.js`
- [x] T004 [P] [US1] Update `app.json` to add `runtimeVersion: { "policy": "sdkVersion" }` and `web: { "bundler": "metro" }` in `app.json`
- [x] T005 [US1] Add `start:go`, `update:preview`, and `update:prod` scripts and `expo-updates` dependency in `package.json`

**Checkpoint**: Mecanismo de deploy EAS Update (`update:preview`, `update:prod`) e `app.config.js` configurados e validados por testes unitários.

---

## Phase 3: User Story 2 - Inicialização via Túnel para Expo Go e Compatibilidade de Runtime (Priority: P1)

**Goal**: Garantir que ao abrir o aplicativo no cliente oficial **Expo Go** (via `npm run start:go` ou QR Code do EAS Update), módulos nativos exclusivos de builds customizadas (`react-native-pdf`) não causem crash de `TurboModuleRegistry` na inicialização.

**Independent Test**: Verificar que `src/components/rulebooks/pdf-reader.tsx` detecta o ambiente `storeClient` (Expo Go) e faz fallback seguro sem importar estaticamente o módulo nativo `RNPDFPdfView`.

### Implementation for User Story 2

- [x] T006 [US2] Guard `react-native-pdf` native module resolution in `src/components/rulebooks/pdf-reader.tsx` so running inside the standard Expo Go client (`Constants.appOwnership === 'expo'` / `executionEnvironment === 'storeClient'`) falls back cleanly without crashing

**Checkpoint**: Aplicativo 100% compatível com o cliente oficial **Expo Go** em Android e iOS.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Validação final de tipagem estrita, suíte completa de testes e auditoria visual Impeccable.

- [x] T007 Run `npm run typecheck`, `npm test`, and `npm run ui:audit` to confirm 0 TypeScript errors, 100% test pass rate across all suites, and 0 Impeccable UI violations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências (`T001`).
- **Phase 2 (US1 - P1)**: Depende de `T001` (`T002`–`T005`).
- **Phase 3 (US2 - P1)**: Pode rodar em paralelo ou após a Fase 2 (`T006`).
- **Phase 4 (Polish)**: Depende das Fases 2 e 3 (`T007`).

### Parallel Opportunities

- `T002`, `T003`, `T004` e `T006` atuam em arquivos distintos e podem ser executadas em paralelo.

---

## Parallel Example: User Story 1 & 2

```bash
Task: "T003 [P] [US1] Create dynamic app.config.js in app.config.js"
Task: "T004 [P] [US1] Update app.json with runtimeVersion sdkVersion policy in app.json"
Task: "T006 [US2] Guard react-native-pdf native module resolution in src/components/rulebooks/pdf-reader.tsx"
```

---

## Implementation Strategy

1. Criar `.env.example` e `app.config.js` seguindo o padrão exato do `piapiupiu` (`T001`–`T003`).
2. Configurar `app.json` e `package.json` com `runtimeVersion` e scripts `start:go`, `update:preview` e `update:prod` (`T004`–`T005`).
3. Proteger o `pdf-reader.tsx` para execução no cliente Expo Go e rodar toda a bateria de testes (`T006`–`T007`).
