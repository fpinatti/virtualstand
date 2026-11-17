---
description: "Task list for AI-Assisted Rulebook Acquisition & Auto-Download Sync"
---

# Tasks: AI-Assisted Rulebook Acquisition & Auto-Download Sync (013-ai-rulebook-download-sync)

**Input**: Design documents from `/specs/013-ai-rulebook-download-sync/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are provided for each task

---

## Phase 1: Setup & Contracts

**Purpose**: Define the contracts, directories, and data structures for rulebook discovery and download

- [x] T001 Define TypeScript contract interfaces for rulebook finder request, response, and progress in `specs/013-ai-rulebook-download-sync/contracts/find-rulebook-contract.ts`
- [x] T002 Ensure target directories `assets/rulebooks/` and `assets/data/` exist with proper filesystem permissions

---

## Phase 2: Foundational Infrastructure

**Purpose**: Core endpoint and binary validation mechanisms required by all user stories

- [x] T003 Implement binary `%PDF-` signature validation and HTTP status guards in `app/api/find-rulebook+api.ts`
- [x] T004 [P] Build the curated community and publisher registry mapping BGG IDs to verified Portuguese download sources in `app/api/find-rulebook+api.ts`
- [x] T005 [P] Create unit contract tests for the API route in `tests/unit/find-rulebook-api.test.ts`

**Checkpoint**: Foundational API route functional and testable with mock/real payloads

---

## Phase 3: User Story 1 - One-Click Batch Rulebook Audit, AI Discovery & Download (Priority: P1) 🎯 MVP

**Goal**: Pressing "📥 Verificar e Vincular Manuais" in Settings audits the user's collection, identifies missing physical PDFs, retrieves authentic PT-BR PDFs via the finder API, downloads the binaries to `assets/rulebooks/`, and registers them in SQLite and the versioned catalog file.

**Independent Test**: Execute `batchSyncService.syncMissingRulebooks()` on a collection missing rulebooks; verify that authentic PDFs are fetched, written to `assets/rulebooks/`, inserted into SQLite with `status = 'READY'`, and persisted to `assets/data/virtualstand-catalog.json`.

### Tests for User Story 1
- [x] T006 [P] [US1] Unit test `syncMissingRulebooks` invoking `/api/find-rulebook` for uncataloged games in `tests/unit/batch-sync.test.ts`
- [x] T007 [P] [US1] Unit test verifying that existing verified rulebooks in `assets/rulebooks/` are skipped without re-downloading in `tests/unit/batch-sync.test.ts`

### Implementation for User Story 1
- [x] T008 [US1] Implement `/api/find-rulebook` POST handler in `app/api/find-rulebook+api.ts` supporting curated registry and AI search discovery
- [x] T009 [US1] Integrate `/api/find-rulebook` into `batchSyncService.syncMissingRulebooks` in `src/services/batch-sync.service.ts`
- [x] T010 [US1] Update `catalogService.saveCatalogToDisk()` call at the conclusion of `syncMissingRulebooks` in `src/services/batch-sync.service.ts`
- [x] T011 [US1] Update the CLI export tool `scripts/export-catalog.mjs` with exact token-boundary slug matching to ensure clean Git versioning

**Checkpoint**: User Story 1 functional — collection rulebooks can be audited and acquired in batch.

---

## Phase 4: User Story 2 - Real-Time Visual Progress & Granular Status Feedback (Priority: P2)

**Goal**: Provide granular, real-time feedback during batch rulebook downloads, displaying the active title, processed ratio, and final summary report.

**Independent Test**: Trigger batch rulebook sync from `app/(tabs)/settings.tsx` and observe the progress bar, active game title label, and final modal summary.

### Implementation for User Story 2
- [x] T012 [US2] Wire progress callback events (`stage`, `current`, `total`, `currentGameTitle`, `message`) into `app/(tabs)/settings.tsx`
- [x] T013 [US2] Add summary modal displaying `alreadyHadCount`, `newlySyncedCount`, `unavailableCount`, and `durationMs` upon completion in `app/(tabs)/settings.tsx`
- [x] T014 [US2] Ensure individual unavailable or timed-out downloads increment `unavailableCount` and continue without crashing the batch run

**Checkpoint**: User Story 2 functional — users have real-time visibility into download operations.

---

## Phase 5: User Story 3 - On-Demand Single Game Rulebook Resolution & Linking (Priority: P3)

**Goal**: Allow users to download and link a missing rulebook directly from an individual game's detail view without executing a full collection batch sync.

**Independent Test**: Open a game missing a manual in `src/components/game-detail-sheet.tsx`, tap "Baixar Manual", verify the manual downloads, and confirm the button transitions to "Ler Manual".

### Implementation for User Story 3
- [x] T015 [US3] Add `downloadAndAttachRulebookForGame(bggId: number, title: string)` method in `src/services/rulebook.service.ts`
- [x] T016 [US3] Update `src/components/game-detail-sheet.tsx` to display a "Baixar Manual (PT-BR)" action when a rulebook is missing and trigger on-demand acquisition
- [x] T017 [US3] Invalidate rulebook hook state upon successful download to immediately refresh the UI and display the PDF viewer button

**Checkpoint**: User Story 3 functional — individual games can acquire rulebooks on-demand.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, regression testing, and code quality governance

- [x] T018 Run precision matching audit to verify zero false-positive matches (e.g., verifying "TEN" and "Cat and the Tower" are never misassociated)
- [x] T019 [P] Run full unit test suite (`npm test`) across all 38 test suites ensuring 100% pass rate
- [x] T020 [P] Run strict TypeScript typecheck (`npm run typecheck`) ensuring 0 type errors
- [x] T021 [P] Run Impeccable UI design tokens audit (`npm run ui:audit`) ensuring 0 unapproved color/token violations

---

## Dependencies & Execution Order

```text
Phase 1: Setup & Contracts (T001, T002)
   │
   ▼
Phase 2: Foundational Infrastructure (T003, T004, T005)
   │
   ▼
Phase 3: User Story 1 (P1) 🎯 MVP (T006 - T011)
   │
   ▼
Phase 4: User Story 2 (P2) Progress Feedback (T012 - T014)
   │
   ▼
Phase 5: User Story 3 (P3) Single Game On-Demand (T015 - T017)
   │
   ▼
Phase 6: Polish & Quality Governance (T018 - T021)
```
