# Tasks: Board Game Card Sleeve Inventory and Sizing Catalog

**Input**: Design documents from `specs/003-card-sleeve-manager/` (`plan.md`, `spec.md`, `data-model.md`, `contracts/`, `research.md`, `quickstart.md`)

**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `contracts/`, `research.md`, `quickstart.md`

**Tests**: Test tasks included per Constitution Principle V (TDD for deficit math, community catalog lookups, and inventory deduction).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema expansion, SQLite table initialization, and contract re-exports

- [x] T001 Define Drizzle ORM schemas for game_sleeves and sleeve_inventory tables in src/db/schema.ts
- [x] T002 [P] Update database client initialization in src/db/client.ts with CREATE TABLE IF NOT EXISTS for sleeve tables
- [x] T003 [P] Re-export sleeve contracts and model types in src/services/sleeve-types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Community sleeve catalog dataset and SQLite sleeve repository

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create pre-bundled community sleeve catalog data mapping popular BGG IDs to card dimensions and counts in src/data/community-sleeves-catalog.ts
- [x] T005 [P] Write unit tests for community sleeve catalog matching and format resolution in tests/unit/sleeve-catalog.test.ts
- [x] T006 [P] Implement SleeveRepository handling CRUD for game_sleeves and sleeve_inventory in src/db/repositories/sleeve.repository.ts

**Checkpoint**: Foundational layer complete — database repository and community catalog ready.

---

## Phase 3: User Story 1 - Card Sleeve Specification and Multi-Size Tracking per Game (Priority: P1) 🎯 MVP

**Goal**: A collector can view card sizes and counts for any game in their collection, toggle sleeved status, and manually add or edit card sets.

**Independent Test**: Open any game from the collection; open the sleeves modal; verify card sizes/counts are listed; toggle sleeved status and confirm local persistence.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Write unit tests for game sleeve requirement validation and multi-size tracking in tests/unit/game-sleeves.test.ts

### Implementation for User Story 1

- [x] T008 [P] [US1] Implement GameSleeveManagerModal component for viewing, toggling, and editing card sleeve requirements in src/components/sleeves/game-sleeve-manager.tsx
- [x] T009 [US1] Integrate sleeve status indicator and "Gerenciar Sleeves" trigger into GameDetailSheet in src/components/game-detail-sheet.tsx
- [x] T010 [US1] Implement seedGameSleevesFromCatalog method in SleeveManagerService in src/services/sleeve-manager.service.ts

**Checkpoint**: User Story 1 (MVP) is fully functional. Users can track sleeves per game directly from the detail sheet.

---

## Phase 4: User Story 2 - Sleeve Inventory Stock and Automated Shopping List Calculator (Priority: P2)

**Goal**: Track owned spare sleeve packs and compute an aggregated shopping list showing net deficits and packs to buy across the collection.

**Independent Test**: Add 1 pack of 100 Standard sleeves to inventory; have un-sleeved games requiring 140 Standard sleeves; verify shopping list recommends buying 1 pack.

### Tests for User Story 2

- [x] T011 [P] [US2] Write unit tests for shopping list demand calculation, inventory deduction, and pack rounding in tests/unit/sleeve-calculator.test.ts

### Implementation for User Story 2

- [x] T012 [P] [US2] Implement calculateShoppingList algorithm with stock deduction and pack rounding in src/services/sleeve-manager.service.ts
- [x] T013 [P] [US2] Implement InventoryListView component for managing user spare sleeve packs in src/components/sleeves/inventory-list.tsx
- [x] T014 [US2] Implement ShoppingListView component displaying aggregated buy requirements with pack counts in src/components/sleeves/shopping-list-view.tsx
- [x] T015 [US2] Implement useSleeves React hook for reactive inventory and shopping list state in src/hooks/use-sleeves.ts
- [x] T016 [US2] Add Sleeves tab navigation route in app/(tabs)/_layout.tsx and implement main hub screen in app/(tabs)/sleeves.tsx

**Checkpoint**: User Stories 1 and 2 work together. Users can manage their spare sleeve stock and view calculated shopping needs.

---

## Phase 5: User Story 3 - Community Sleeve Catalog Pre-Population and Auto-Matching (Priority: P3)

**Goal**: Automatically associate community sleeve requirements during collection sync or first view.

**Independent Test**: Import games from BGG; verify sleeve requirements are pre-filled automatically without manual entry.

### Tests for User Story 3

- [x] T017 [P] [US3] Write unit tests for automated sleeve requirement pre-population during import in tests/unit/sleeve-auto-matching.test.ts

### Implementation for User Story 3

- [x] T018 [US3] Integrate automatic sleeve requirement seeding into CollectionSyncService pipeline in src/services/collection-sync.service.ts

**Checkpoint**: All user stories complete. New games automatically receive sleeve specifications upon import.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, database indexing, and full verification

- [x] T019 [P] Add database indexing on game_sleeves(bgg_id) and game_sleeves(is_sleeved) in src/db/schema.ts
- [x] T020 Verify full test suite and strict TypeScript compilation (tsc --noEmit) across the entire codebase

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion (T004-T006) — MVP milestone
- **User Story 2 (Phase 4)**: Depends on User Story 1 (T008-T010) and Foundational repositories
- **User Story 3 (Phase 5)**: Depends on User Story 1 and integrates with CollectionSyncService
- **Polish (Phase 6)**: Depends on all target user stories being complete

---

## Parallel Opportunities

```bash
# Phase 1 Parallel Setup
Task T002: Update database client in src/db/client.ts
Task T003: Re-export contracts in src/services/sleeve-types.ts

# Phase 2 Parallel Tasks
Task T005: Write unit tests in tests/unit/sleeve-catalog.test.ts
Task T006: Implement SleeveRepository in src/db/repositories/sleeve.repository.ts

# User Story 1 Parallel Tasks
Task T007: Write unit tests in tests/unit/game-sleeves.test.ts
Task T008: Implement GameSleeveManagerModal in src/components/sleeves/game-sleeve-manager.tsx

# User Story 2 Parallel Tasks
Task T011: Write unit tests in tests/unit/sleeve-calculator.test.ts
Task T013: Implement InventoryListView in src/components/sleeves/inventory-list.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup (T001-T003).
2. Complete Phase 2: Foundational (T004-T006) — unlocks repository & catalog data.
3. Complete Phase 3: User Story 1 (T007-T010).
4. **STOP and VALIDATE**: Open a game, inspect sleeve sizes, toggle sleeved state, and verify offline SQLite persistence.

### Incremental Delivery
1. **Increment 1**: MVP (Setup + Foundation + User Story 1) $\rightarrow$ Sleeve tracking per game.
2. **Increment 2**: User Story 2 $\rightarrow$ Spare inventory stock + automated shopping list.
3. **Increment 3**: User Story 3 $\rightarrow$ Automatic seeding on BGG import.
4. **Increment 4**: Polish $\rightarrow$ Query indexes, full test suite pass.

