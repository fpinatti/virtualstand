# Tasks: Sistema de Design e Governança Visual Impeccable

**Input**: Design documents from `/specs/005-impeccable-ui-system/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/ui-system-contract.ts](./contracts/ui-system-contract.ts)

**Tests**: Incluídos conforme especificado em `plan.md` e `FR-012` / `SC-002` para validação matemática de contraste WCAG 2.1, invariantes de escala e auditoria determinística de conformidade visual.

**Organization**: Tarefas agrupadas por história de usuário (`US1`, `US2`, `US3`) para permitir implementação, teste e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode ser executada em paralelo (arquivos distintos, sem dependências de tarefas incompletas)
- **[Story]**: História de usuário associada (`[US1]`, `[US2]`, `[US3]`)
- Caminhos exatos de arquivos incluídos em todas as tarefas

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Instalar o pacote e habilidades do Impeccable e estabelecer a documentação canônica de produto e design na raiz do repositório.

- [x] T001 Install `impeccable` package in `package.json` and provision Impeccable design skills in `.agents/skills/`
- [x] T002 [P] Create canonical product context document in `PRODUCT.md`
- [x] T003 [P] Create canonical design system specification (*Tactile Tabletop Lounge*) in `DESIGN.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Criar o catálogo central de tokens semânticos e o motor determinístico de auditoria em `src/ui/` antes da refatoração das telas e componentes.

**⚠️ CRITICAL**: Nenhuma história de usuário pode ser iniciada antes da conclusão desta fase.

- [x] T004 Implement semantic design tokens (`colors`, `spacing`, `typography`, `radii`, `layout`) matching `DesignTokensContract` in `src/ui/tokens.ts`
- [x] T005 Implement deterministic WCAG 2.1 luminance/contrast calculator and token validator in `src/ui/audit.ts`
- [x] T006 Create UI system barrel export file in `src/ui/index.ts`

**Checkpoint**: Fundação de tokens e auditoria pronta — implementação das histórias de usuário liberada.

---

## Phase 3: User Story 1 - Identidade Visual Unificada e Sistema de Tokens Semânticos (Priority: P1) 🎯 MVP

**Goal**: Estabelecer a identidade visual *Tactile Tabletop Lounge* (Obsidiana Quente, Marfim Editorial e Latão Âmbar) com contraste WCAG AA garantido nos layouts globais de navegação e na cena da estante.

**Independent Test**: Executar `npx jest tests/unit/impeccable-ui-system.test.ts` e inspecionar `app/_layout.tsx` e `app/(tabs)/_layout.tsx` confirmando que 100% dos pares semânticos passam no cálculo de contraste (`>= 4.5:1` para textos normais e `>= 3.0:1` para elementos gráficos).

### Tests for User Story 1

- [x] T007 [P] [US1] Create unit test suite validating semantic token completeness, monotonic spacing/typography scales, touch target minimums, and WCAG AA contrast ratios in `tests/unit/impeccable-ui-system.test.ts`

### Implementation for User Story 1

- [x] T008 [P] [US1] Refactor root stack layout, status bar, and startup loading/error screens to use semantic tokens in `app/_layout.tsx`
- [x] T009 [P] [US1] Refactor main tabs navigation bar and header styles to use semantic tokens in `app/(tabs)/_layout.tsx`
- [x] T010 [P] [US1] Harmonize 3D bookcase wood/backing materials and spine generator palette with the Impeccable theme in `src/components/shelf-3d/bookcase-mesh.tsx` and `src/services/spine-generator.service.ts`

**Checkpoint**: User Story 1 funcional e testável de forma independente (identidade visual global e tokens validados).

---

## Phase 4: User Story 2 - Padronização de Componentes e Refinamento das Telas do App (Priority: P2)

**Goal**: Disponibilizar as 7 primitivas visuais reutilizáveis do sistema Impeccable e migrar todas as telas (`Coleção`, `Estante 3D`, `Sleeves`, `Configurações`, `Leitor de Manuais`) e componentes (`GameDetailSheet`, `Rulebooks`, `PlayLog`) para utilizá-las com hierarquia clara e alvos de toque `>= 44pt`.

**Independent Test**: Navegar pelas 4 abas, abrir `GameDetailSheet` e `/rulebook/[id]` no Mobile ou Web (`http://localhost:8083`), verificando o uso uniforme das primitivas `Button`, `Card`, `Badge`, `Input`, `SectionHeader`, `EmptyState` e `ScreenContainer`.

### Implementation for User Story 2 — Primitivas Base (`src/ui/primitives/`)

- [x] T011 [P] [US2] Implement `Button` primitive (`primary`, `secondary`, `ghost`, `danger`; `minHeight: 44`) in `src/ui/primitives/button.tsx`
- [x] T012 [P] [US2] Implement `Card` primitive (`default`, `elevated`, `outlined`, `subtle`) in `src/ui/primitives/card.tsx`
- [x] T013 [P] [US2] Implement `Badge` primitive (`primary`, `neutral`, `success`, `warning`, `danger`, `info`) in `src/ui/primitives/badge.tsx`
- [x] T014 [P] [US2] Implement `Input` primitive with label, error state, and `minHeight: 44` in `src/ui/primitives/input.tsx`
- [x] T015 [P] [US2] Implement `SectionHeader` primitive with optional badge and action button in `src/ui/primitives/section-header.tsx`
- [x] T016 [P] [US2] Implement `EmptyState` primitive with title, description, and optional primary CTA in `src/ui/primitives/empty-state.tsx`
- [x] T017 [P] [US2] Implement responsive `ScreenContainer` primitive enforcing `maxContentWidth` on Web in `src/ui/primitives/screen-container.tsx`

### Implementation for User Story 2 — Migração das Telas e Componentes

- [x] T018 [P] [US2] Refactor Collection screen (`Coleção`) to use `ScreenContainer`, `Card`, `Badge`, `Input`, `Button`, and `EmptyState` in `app/(tabs)/collection.tsx`
- [x] T019 [P] [US2] Refactor 3D Shelf screen (`Estante 3D`) and scene wrapper to use `EmptyState`, `Button`, and `glassOverlay` tokens in `app/(tabs)/shelf.tsx` and `src/components/shelf-3d/shelf-scene.tsx`
- [x] T020 [P] [US2] Refactor Sleeves Hub screen (`Central de Sleeves`) to use `ScreenContainer`, `Card`, `Badge`, `Button`, `Input`, and `EmptyState` in `app/(tabs)/sleeves.tsx`
- [x] T021 [P] [US2] Refactor BGG Settings & Sync screen (`Configurações`) to use `ScreenContainer`, `Card`, `Badge`, `Button`, and `Input` in `app/(tabs)/settings.tsx`
- [x] T022 [US2] Refactor `GameDetailSheet` and `PersonalRatingInput` to use Impeccable primitives and tokens in `src/components/game-detail-sheet.tsx` and `src/components/personal-rating-input.tsx`
- [x] T023 [P] [US2] Refactor `RulebookList` and `RulebookImportSheet` to use Impeccable primitives and tokens in `src/components/rulebooks/rulebook-list.tsx` and `src/components/rulebooks/rulebook-import-sheet.tsx`
- [x] T024 [P] [US2] Refactor `PdfReader` (native and web), `AnnotationsPanel`, and `app/rulebook/[id].tsx` to use Impeccable primitives and tokens in `src/components/rulebooks/pdf-reader.tsx`, `src/components/rulebooks/pdf-reader.web.tsx`, `src/components/rulebooks/annotations-panel.tsx`, and `app/rulebook/[id].tsx`
- [x] T025 [P] [US2] Refactor Play Log components (`PlayStatsCard`, `PlayHistory`, `PlaySessionForm`, `PlayerPicker`) to use Impeccable primitives and tokens in `src/components/playlog/play-stats-card.tsx`, `src/components/playlog/play-history.tsx`, `src/components/playlog/play-session-form.tsx`, and `src/components/playlog/player-picker.tsx`

**Checkpoint**: Todas as telas e componentes do aplicativo gerenciados pelas primitivas e tokens do Impeccable.

---

## Phase 5: User Story 3 - Governança e Auditoria Determinística de UI (Priority: P3)

**Goal**: Garantir auditoria determinística contínua contra regressões visuais (cores clichês de IA, falta de contraste, ausência de documentação de design ou estilos órfãos).

**Independent Test**: Executar `npm run ui:audit` e `npm test` verificando que 100% dos arquivos em `app/` e `src/components/` estão livres da paleta clichê legada (`#0f172a`, `#6366f1`, `#4f46e5`) e que `PRODUCT.md` e `DESIGN.md` atendem às seções obrigatórias do Impeccable.

### Implementation for User Story 3

- [x] T026 [US3] Implement source-code anti-pattern detector (`auditSourceTextForViolations`) in `src/ui/audit.ts`
- [x] T027 [US3] Add automated repository-wide UI compliance tests scanning `app/`, `src/components/`, `PRODUCT.md`, and `DESIGN.md` in `tests/unit/impeccable-ui-system.test.ts`
- [x] T028 [US3] Add `"ui:audit"` script in `package.json`

**Checkpoint**: Governança automatizada ativa e validando todo o repositório.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final de tipagem estrita, testes de regressão e execução do guia `quickstart.md`.

- [x] T029 Run `npm run typecheck` and `npm test` to confirm 0 TypeScript errors and 100% pass rate across all 26 test suites
- [x] T030 Validate Web Localhost bundle (`npx expo export --platform web`) and verify all `quickstart.md` scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências — pode iniciar imediatamente (`T001`–`T003`).
- **Phase 2 (Foundational)**: Depende da Fase 1 — bloqueia todas as histórias de usuário (`T004`–`T006`).
- **Phase 3 (US1 - P1)**: Depende da Fase 2 (`T007`–`T010`).
- **Phase 4 (US2 - P2)**: Depende da Fase 2; as primitivas (`T011`–`T017`) precedem a migração das telas (`T018`–`T025`).
- **Phase 5 (US3 - P3)**: Depende da conclusão da migração na Fase 4 para que o scanner de conformidade aprove 100% dos arquivos (`T026`–`T028`).
- **Phase 6 (Polish)**: Depende de todas as fases anteriores (`T029`–`T030`).

### Parallel Opportunities

- Na **Fase 1**, `T002` (`PRODUCT.md`) e `T003` (`DESIGN.md`) podem ser criadas em paralelo.
- Na **Fase 3 (US1)**, `T007`, `T008`, `T009` e `T010` atuam em arquivos distintos e podem rodar em paralelo.
- Na **Fase 4 (US2)**, todas as 7 primitivas (`T011`–`T017`) podem ser criadas em paralelo, seguidas pela refatoração paralela das telas (`T018`–`T021`) e subsistemas (`T023`–`T025`).

---

## Parallel Example: User Story 2 Primitives

```bash
# Construir todas as primitivas visuais em paralelo:
Task: "T011 [P] [US2] Implement Button primitive in src/ui/primitives/button.tsx"
Task: "T012 [P] [US2] Implement Card primitive in src/ui/primitives/card.tsx"
Task: "T013 [P] [US2] Implement Badge primitive in src/ui/primitives/badge.tsx"
Task: "T014 [P] [US2] Implement Input primitive in src/ui/primitives/input.tsx"
Task: "T015 [P] [US2] Implement SectionHeader primitive in src/ui/primitives/section-header.tsx"
Task: "T016 [P] [US2] Implement EmptyState primitive in src/ui/primitives/empty-state.tsx"
Task: "T017 [P] [US2] Implement ScreenContainer primitive in src/ui/primitives/screen-container.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Concluir Fase 1 (Setup: `impeccable`, `PRODUCT.md`, `DESIGN.md`).
2. Concluir Fase 2 (Foundational: `src/ui/tokens.ts`, `src/ui/audit.ts`, `src/ui/index.ts`).
3. Concluir Fase 3 (US1: Testes de contraste WCAG AA e aplicação nos layouts globais e cena 3D).
4. Validar o MVP com `npm test`.

### Incremental Delivery

1. Adicionar as 7 primitivas padronizadas (`T011`–`T017`).
2. Migrar as 4 abas principais (`T018`–`T021`) e a Ficha de Detalhes + Manuais + Partidas (`T022`–`T025`).
3. Ativar o scanner determinístico sobre todo o código-fonte (`T026`–`T028`) e validar o bundle final (`T029`–`T030`).
