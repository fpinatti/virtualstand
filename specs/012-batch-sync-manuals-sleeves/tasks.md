---
description: "Task list for Batch Sync for Rulebooks & AI-Powered Sleeves"
---

# Tasks: Batch Sync for Rulebooks & AI-Powered Sleeves (012-batch-sync-manuals-sleeves)

**Input**: Design documents from `specs/012-batch-sync-manuals-sleeves/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/batch-sync-contracts.ts`, `quickstart.md`

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story identifier ([US1], [US2], [US3])
- Exact file paths included in every task description

---

## Phase 1: Setup & Foundational Prerequisites

**Purpose**: Define types, contracts, test scaffolding, and the environment visibility guard.

- [x] T001 Define and export batch sync types and contracts in src/services/batch-sync-types.ts
- [x] T002 [P] Create unit test suite scaffolding in tests/unit/batch-sync.test.ts
- [x] T003 Implement isLocalhostOrDev() environment detection helper in src/services/batch-sync.service.ts

---

## Phase 2: User Story 1 - Bulk Audit & Sync of Collection Rulebook PDFs (Priority: P1) 🎯 MVP

**Goal**: Provide one-click audit and download of available Brazilian Portuguese (PT-BR) rulebooks for all games in the collection that currently lack offline manuals.

**Independent Test**: Call `syncMissingRulebooks()` on a collection with mixed rulebook availability. Verify that missing titles with available PT-BR manuals are registered as READY, existing ones are untouched, and a summary report is returned.

### Tests for User Story 1
- [x] T004 [P] [US1] Add unit tests for syncMissingRulebooks() and progress callbacks in tests/unit/batch-sync.test.ts

### Implementation for User Story 1
- [x] T005 [US1] Implement syncMissingRulebooks() with progress reporting in src/services/batch-sync.service.ts

**Checkpoint**: User Story 1 is functional. The user can bulk sync all missing PT-BR rulebooks across their collection with real-time feedback.

---

## Phase 3: User Story 2 - Bulk Sleeve Audit with AI Fallback for Unknown Titles (Priority: P1)

**Goal**: Automatically audit all collection games for sleeve specs, seeding from local community catalog first, recognizing zero-card games, and querying Gemini AI in structured JSON format for uncataloged games.

**Independent Test**: Run `syncMissingSleeves()` on a collection with catalog games, zero-card games, and custom uncataloged games. Verify local seeding, zero-card handling, and AI fallback insertion.

### Tests for User Story 2
- [x] T006 [P] [US2] Add unit tests for 4-tier sleeve resolution hierarchy and Gemini AI structured generation in tests/unit/batch-sync.test.ts

### Implementation for User Story 2
- [x] T007 [US2] Implement Gemini AI prompt builder and structured JSON sleeve parser in src/services/batch-sync.service.ts
- [x] T008 [US2] Implement syncMissingSleeves() multi-tier orchestration in src/services/batch-sync.service.ts

**Checkpoint**: User Story 2 is functional. Uncataloged games are augmented via Gemini AI without re-querying existing or catalog-matched games.

---

## Phase 4: User Story 3 - Transparent Token Budgeting & Pre-Execution Estimation (Priority: P2)

**Goal**: Audit collection games before execution, calculating pending AI lookups and displaying an accurate token budget estimation to the user.

**Independent Test**: Call `auditCollectionSleeves()` on a collection and verify calculated counts of already-had, zero-card, catalog-matched, and pending AI titles with token estimate ($Pending \times 220$).

### Tests for User Story 3
- [x] T009 [P] [US3] Add unit tests for auditCollectionSleeves() and token estimation calculation in tests/unit/batch-sync.test.ts

### Implementation for User Story 3
- [x] T010 [US3] Implement auditCollectionSleeves() in src/services/batch-sync.service.ts

**Checkpoint**: User Story 3 is complete. The user sees clear token estimates before launching AI sleeve discovery.

---

## Phase 5: UI Integration in Settings Screen (Localhost-Guarded)

**Purpose**: Expose the maintenance controls exclusively in development / localhost mode inside the Settings screen.

- [x] T011 [US1] [US2] [US3] Implement Developer Batch Maintenance Card in app/(tabs)/settings.tsx with environment guard, audit stats, token estimation badge, and execution buttons

---

## Phase 6: Polish, Verification & Quality Gates

**Purpose**: Cross-cutting verification, TypeScript compilation, full regression testing, and design system audit.

- [x] T012 Run unit test suite tests/unit/batch-sync.test.ts via npm test
- [x] T013 Run full test suite with Jest across all 32 test suites via npm test
- [x] T014 Run TypeScript compiler check via npm run typecheck with strict mode
- [x] T015 Run Impeccable design system audit via npm run ui:audit

---

## Dependencies & Execution Order

```text
Phase 1 (Setup) ──> Phase 2 (US1: Batch Rulebooks) 🎯 MVP
                 └──> Phase 3 (US2: Batch Sleeves & AI)
                               │
                               ▼
                      Phase 4 (US3: Token Estimation)
                               │
                               ▼
                      Phase 5 (Settings UI Integration)
                               │
                               ▼
                      Phase 6 (Polish & Quality Gates)
```

## Parallel Opportunities

- T001, T002 can be started in parallel.
- Test suites T004, T006, T009 can be prepared in parallel with their respective phases.
- T012, T013, T014, T015 run sequentially during quality gate signoff.

## Implementation Strategy

1. **MVP Scope (Phase 1 to Phase 2)**: Deliver `syncMissingRulebooks()` so all collection games get their offline PT-BR PDFs.
2. **Increment 2 (Phase 3 & Phase 4)**: Enable sleeve discovery with community seeding, Gemini AI fallback, and token estimation.
3. **Increment 3 (Phase 5 & Phase 6)**: Integrate the localhost maintenance card in Settings and verify all quality gates.
