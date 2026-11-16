# Tasks: Simplificação de Sleeves para Consulta Direta por Jogo

**Input**: Design documents from `/specs/007-per-game-sleeve-info/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/game-sleeve-info-contract.ts](./contracts/game-sleeve-info-contract.ts)

**Tests**: Incluídos para verificar que a remoção da seção global de sleeves preserva 100% da tipagem, testes automatizados e auditoria visual Impeccable (`SC-003`).

**Organization**: Tarefas agrupadas por história de usuário (`US1`, `US2`) para permitir implementação e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode ser executada em paralelo (arquivos distintos, sem dependências de tarefas incompletas)
- **[Story]**: História de usuário associada (`[US1]`, `[US2]`)
- Caminhos exatos de arquivos incluídos em todas as tarefas

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Expor o contrato de visualização de sleeves por jogo em `src/services/sleeve-types.ts`.

- [x] T001 Export `GameSleeveInfoProps` and `GameSleeveRequirementView` from `specs/007-per-game-sleeve-info/contracts/game-sleeve-info-contract.ts` in `src/services/sleeve-types.ts`

---

## Phase 2: User Story 1 - Remoção da Aba Global de Estoque/Compras de Sleeves (Priority: P1) 🎯 MVP

**Goal**: Remover a aba "Sleeves" (`Central de Sleeves`) da navegação principal e excluir as telas e componentes de controle de estoque pessoal ("Meu Estoque") e lista de compras ("Lista de Compras de Sleeves").

**Independent Test**: Verificar `app/(tabs)/_layout.tsx` e confirmar que apenas as abas `collection`, `shelf` e `settings` existem em `app/(tabs)/`.

### Implementation for User Story 1

- [x] T002 [US1] Remove the `sleeves` `<Tabs.Screen>` entry from `app/(tabs)/_layout.tsx`
- [x] T003 [P] [US1] Delete global sleeves tab screen `app/(tabs)/sleeves.tsx` and unused hook `src/hooks/use-sleeves.ts`
- [x] T004 [P] [US1] Delete unused inventory and shopping list components `src/components/sleeves/inventory-list.tsx` and `src/components/sleeves/shopping-list-view.tsx`

**Checkpoint**: Navegação principal enxuta com apenas **Coleção**, **Estante 3D** e **Configurações**.

---

## Phase 3: User Story 2 - Exibição Direta dos Sleeves Necessários na Ficha de Cada Jogo (Priority: P1)

**Goal**: Exibir diretamente dentro de `GameDetailSheet` a lista de sleeves que o jogo selecionado precisa (conjunto de cartas, formato, medidas `largura x altura mm` e quantidade de cartas), sem checkboxes de envelopamento nem modais de estoque.

**Independent Test**: Abrir `GameDetailSheet` para um jogo da coleção e verificar a seção inline `Sleeves Necessários` mostrando as dimensões em milímetros e a quantidade de cartas exigida pelo jogo.

### Implementation for User Story 2

- [x] T005 [US2] Create inline `GameSleeveInfoSection` component displaying per-game card sets, sleeve format, dimensions (`widthMm x heightMm mm`), card count, and optional manual format addition/removal in `src/components/sleeves/game-sleeve-info.tsx`
- [x] T006 [US2] Replace `GameSleeveManagerModal` and button in `src/components/game-detail-sheet.tsx` with inline `GameSleeveInfoSection` and delete `src/components/sleeves/game-sleeve-manager.tsx`

**Checkpoint**: Informações de sleeves que cada jogo precisa exibidas diretamente na ficha de detalhes do jogo.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Validação de tipagem estrita, suíte de testes e auditoria visual Impeccable.

- [x] T007 Run `npm run typecheck`, `npm test`, and `npm run ui:audit` to confirm 0 TypeScript errors, 100% test pass rate, and 0 Impeccable UI violations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências (`T001`).
- **Phase 2 (US1 - P1)**: Pode ser executada após `T001` (`T002`–`T004`).
- **Phase 3 (US2 - P1)**: Pode ser executada em paralelo ou em sequência à Fase 2 (`T005`–`T006`).
- **Phase 4 (Polish)**: Depende da conclusão das Fases 2 e 3 (`T007`).

### Parallel Opportunities

- `T003`, `T004` e `T005` atuam em arquivos distintos e podem ser executadas em paralelo.

---

## Parallel Example: User Story 1 & 2

```bash
Task: "T003 [P] [US1] Delete global sleeves tab screen app/(tabs)/sleeves.tsx and src/hooks/use-sleeves.ts"
Task: "T004 [P] [US1] Delete unused inventory and shopping list components"
Task: "T005 [US2] Create inline GameSleeveInfoSection component in src/components/sleeves/game-sleeve-info.tsx"
```

---

## Implementation Strategy

1. Remover a aba `sleeves` e os componentes globais de estoque/compras (`T001`–`T004`).
2. Criar o componente inline `GameSleeveInfoSection` e integrá-lo diretamente ao `GameDetailSheet` (`T005`–`T006`).
3. Validar com `npm run typecheck`, `npm test` e `npm run ui:audit` (`T007`).
