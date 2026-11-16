# Tasks: Corredor 3D de Estantes Paralelas e Navegação em Primeira Pessoa

**Input**: Design documents from `/specs/006-3d-aisle-shelf-navigation/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/aisle-shelf-contract.ts](./contracts/aisle-shelf-contract.ts)

**Tests**: Incluídos conforme especificado em `plan.md`, `SC-004` e na Constituição (Princípio V) para validação matemática do layout bilateral, limites de caminhada da câmera (`Z`) e poses de rotação lateral (`CENTER`, `LEFT`, `RIGHT`).

**Organization**: Tarefas agrupadas por história de usuário (`US1`, `US2`, `US3`) para permitir implementação, teste e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode ser executada em paralelo (arquivos distintos, sem dependências de tarefas incompletas)
- **[Story]**: História de usuário associada (`[US1]`, `[US2]`, `[US3]`)
- Caminhos exatos de arquivos incluídos em todas as tarefas

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Expor os contratos e tipos do corredor 3D (`AisleShelfDimensions`, `PlacedAisleBox`, `AisleCameraBounds`, `CameraFocusSide`, `AisleCameraPose`) para uso nos serviços, hooks e componentes 3D.

- [x] T001 Export `aisle-shelf-contract.ts` types in `src/components/shelf-3d/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implementar os motores matemáticos puros de empacotamento bilateral do corredor e de cinemática de câmera em primeira pessoa antes da atualização dos componentes visuais 3D.

**⚠️ CRITICAL**: Nenhuma história de usuário pode ser iniciada antes da conclusão desta fase.

- [x] T002 [P] Implement pure first-person aisle camera controller (`clampCameraZ`, `applyWalkDelta`, `computeCameraPose`, `isDragGesture`) in `src/services/aisle-camera.service.ts`
- [x] T003 [P] Implement bilateral aisle layout calculation (`calculateAisleLayout`) alternating cubbies across `LEFT` and `RIGHT` walls with inward-facing spines and camera bounds in `src/services/shelf-layout.service.ts`
- [x] T004 Update `useShelfCollection` hook to expose `aisle`, `aisleBoxes`, and `cameraBounds` alongside existing properties in `src/hooks/use-shelf-collection.ts`

**Checkpoint**: Fundação matemática de layout bilateral e câmera do corredor pronta.

---

## Phase 3: User Story 1 - Corredor 3D de Estantes Paralelas e Caminhada pelo Corredor (Priority: P1) 🎯 MVP

**Goal**: Renderizar o corredor 3D com duas estantes paralelas frente a frente (`LEFT` e `RIGHT`), passarela central acarpetada, teto com luminárias lineares em série e locomoção suave para frente/trás ao deslizar o dedo verticalmente (ou usar o scroll no Web).

**Independent Test**: Executar `npx jest tests/unit/aisle-shelf-navigation.test.ts` e abrir a aba `Estante 3D`, deslizando verticalmente para caminhar do início ao fim do corredor entre as duas paredes de jogos.

### Tests for User Story 1

- [x] T005 [P] [US1] Create unit tests for bilateral aisle packing (`LEFT`/`RIGHT` distribution, minimum depth bays, `cameraBounds`) and vertical walk clamping (`clampCameraZ`, `applyWalkDelta`) in `tests/unit/aisle-shelf-navigation.test.ts`

### Implementation for User Story 1

- [x] T006 [P] [US1] Refactor `BookcaseMesh` to render parallel `LEFT` and `RIGHT` multi-tier bookcases, central aisle floor runner, ceiling panels, and recessed linear light fixtures in `src/components/shelf-3d/bookcase-mesh.tsx`
- [x] T007 [US1] Implement first-person camera rig and vertical drag/scroll walk navigation along the corridor `Z` axis in `src/components/shelf-3d/shelf-scene.tsx`

**Checkpoint**: User Story 1 funcional — o usuário visualiza o corredor 3D inspirado na foto de referência e caminha para frente e para trás deslizando o dedo verticalmente.

---

## Phase 4: User Story 2 - Giro Lateral da Câmera para Focar um Lado da Estante e Retorno à Visão Central (Priority: P2)

**Goal**: Permitir clicar em um lado da estante (`Esquerda` ou `Direita`) para girar suavemente a câmera na direção daquela parede e oferecer um controle claro (no padrão Impeccable) para voltar à visualização central padrão do corredor (`Centro`).

**Independent Test**: Clicar na estante esquerda ou direita (ou nos controles rápidos) e verificar que a câmera vira para o lado selecionado; clicar em `Visão Central` e confirmar o retorno suave ao eixo central do corredor.

### Tests for User Story 2

- [x] T008 [P] [US2] Add unit tests for `computeCameraPose` (`CENTER`, `LEFT`, `RIGHT` yaw angles and lateral offset) and `isDragGesture` threshold in `tests/unit/aisle-shelf-navigation.test.ts`

### Implementation for User Story 2

- [x] T009 [US2] Add interactive click/tap handlers on `LEFT` and `RIGHT` bookcase walls (with drag-vs-tap guard) and smooth camera yaw/lateral interpolation in `src/components/shelf-3d/bookcase-mesh.tsx` and `src/components/shelf-3d/shelf-scene.tsx`
- [x] T010 [US2] Add Impeccable HUD navigation controls (`◀ Estante Esq.`, `Visão Central`, `Estante Dir. ▶` and corridor walk hint) in `app/(tabs)/shelf.tsx`

**Checkpoint**: User Story 2 funcional — o usuário vira a câmera para qualquer lado do corredor ao clicar na estante e retorna à visão central com um toque.

---

## Phase 5: User Story 3 - Extração e Inspeção de Caixas nas Estantes Esquerda e Direita (Priority: P3)

**Goal**: Garantir que clicar em uma caixa de jogo na parede esquerda ou direita extraia a caixa perpendicularmente em direção ao centro do corredor, oriente a câmera para aquele lado e abra o `GameDetailSheet` no segundo toque.

**Independent Test**: Tocar em um jogo na parede esquerda e em outro na parede direita, verificando que ambos deslizam para o interior do corredor sem atravessar a marcenaria e abrem o modal de detalhes no segundo toque.

### Tests for User Story 3

- [x] T011 [P] [US3] Add unit tests verifying inward aisle extraction vectors (`+X` for `LEFT` boxes, `-X` for `RIGHT` boxes) and inward spine rotation (`baseRotationY`) in `tests/unit/aisle-shelf-navigation.test.ts`

### Implementation for User Story 3

- [x] T012 [US3] Update `GameBoxMesh` to apply `baseRotationY` (`+Math.PI / 2` for `LEFT`, `-Math.PI / 2` for `RIGHT`), extract boxes toward the aisle center, and focus the box's shelf side on selection in `src/components/shelf-3d/game-box-mesh.tsx` and `src/components/shelf-3d/shelf-scene.tsx`

**Checkpoint**: Todas as histórias de usuário (`US1`, `US2`, `US3`) integradas e funcionais.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final de tipagem estrita, testes automatizados e auditoria de conformidade visual Impeccable.

- [x] T013 Run `npm run typecheck`, `npm test`, and `npm run ui:audit` to confirm 0 TypeScript errors, 100% test pass rate across all suites, and 0 Impeccable UI violations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências — inicia imediatamente (`T001`).
- **Phase 2 (Foundational)**: Depende de `T001` — bloqueia as fases de histórias de usuário (`T002`–`T004`).
- **Phase 3 (US1 - P1)**: Depende da Fase 2 (`T005`–`T007`).
- **Phase 4 (US2 - P2)**: Depende da Fase 3 (`T008`–`T010`).
- **Phase 5 (US3 - P3)**: Depende da Fase 3 (`T011`–`T012`).
- **Phase 6 (Polish)**: Depende de todas as fases anteriores (`T013`).

### Parallel Opportunities

- Na **Fase 2**, `T002` (`src/services/aisle-camera.service.ts`) e `T003` (`src/services/shelf-layout.service.ts`) atuam em arquivos independentes e podem ser executadas em paralelo.
- Na **Fase 3 (US1)**, `T005` (`tests/unit/aisle-shelf-navigation.test.ts`) e `T006` (`src/components/shelf-3d/bookcase-mesh.tsx`) podem ser executadas em paralelo.

---

## Parallel Example: Foundational Services

```bash
# Construir os motores matemáticos puros em paralelo:
Task: "T002 [P] Implement pure first-person aisle camera controller in src/services/aisle-camera.service.ts"
Task: "T003 [P] Implement bilateral aisle layout calculation in src/services/shelf-layout.service.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Concluir Fase 1 (`T001`) e Fase 2 (`T002`–`T004`).
2. Concluir Fase 3 (`T005`–`T007`: Corredor 3D com estantes paralelas e caminhada vertical pelo corredor).
3. Validar com `npm test`.

### Incremental Delivery

1. Adicionar giro lateral ao clicar nas estantes e barra HUD com botão `Visão Central` (`T008`–`T010`).
2. Ajustar rotação base e extração bilateral das caixas de jogos (`T011`–`T012`).
3. Executar validação completa de tipagem, testes e auditoria Impeccable (`T013`).
