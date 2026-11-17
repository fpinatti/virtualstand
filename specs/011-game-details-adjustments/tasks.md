---
description: "Tasks for Game Details Screen Adjustments (011-game-details-adjustments)"
---

# Tasks: Game Details Screen Adjustments

## Phase 1: Sleeves Component Simplification
- [x] T001 [US1] Simplify GameSleeveInfoSection in src/components/sleeves/game-sleeve-info.tsx: rename title to "Sleeves", remove add form, and remove delete buttons.

## Phase 2: PT-BR Rulebooks Download Expansion
- [x] T002 [US2] Expand bundled PDF assets in assets/rulebooks/ and manifest in src/data/bundled-rulebooks-catalog.ts.
- [x] T003 [US2] Add downloadPtBrRulebook helper to src/hooks/use-rulebooks.ts.
- [x] T004 [US2] Add "📥 Baixar manual (PT-BR)" button and handler in src/components/rulebooks/rulebook-list.tsx.

## Phase 3: Game Details Sheet Cleanup (Tags, Calibration, Notes)
- [x] T005 [US3] Remove custom tags section and associated states from src/components/game-detail-sheet.tsx.
- [x] T006 [US4] Replace BoxDimensionEditor with inline read-only physical dimensions card in src/components/game-detail-sheet.tsx.
- [x] T007 [US5] Remove personal notes input, saving state, and "Salvar Anotações" button from src/components/game-detail-sheet.tsx.

## Phase 4: Verification & Quality Gates
- [x] T008 Update and add unit tests in tests/unit/game-details-adjustments.test.ts.
- [x] T009 Run full test suite with Jest across all test suites via npm test.
- [x] T010 Run TypeScript compiler check via npm run typecheck.
- [x] T011 Run UI token audit via npm run ui:audit.
