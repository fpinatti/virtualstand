---
description: "Task list for Pre-populated Sleeves & Brazilian Portuguese Rulebooks"
---

# Tasks: Pre-populated Sleeves & Brazilian Portuguese Rulebooks

**Input**: Design documents from `specs/009-prepopulated-sleeves-manuals/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/preloaded-content-contract.ts`, `quickstart.md`

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story identifier ([US1], [US2], [US3])
- Exact file paths included in every task description

---

## Phase 1: Setup & Asset Structure

**Purpose**: Establish the public asset directory for rulebooks and contract definitions.

- [X] T001 Create public asset directory for rulebooks in assets/rulebooks/
- [X] T002 [P] Define preloaded content interfaces and catalog types in specs/009-prepopulated-sleeves-manuals/contracts/preloaded-content-contract.ts

---

## Phase 2: Foundational Prerequisites

**Purpose**: Core manifests and test scaffolding that all user stories depend upon.

- [X] T003 Create unit and contract test scaffolding in tests/unit/preloaded-content.test.ts
- [X] T004 [P] Create Brazilian Portuguese bundled rulebook catalog manifest in src/data/bundled-rulebooks-catalog.ts

---

## Phase 3: User Story 1 - Instant Sleeve Consultation for Collection Games (Priority: P1) 🎯 MVP

**Goal**: Every game in the user's collection immediately displays accurate card sleeve requirements (card set names, millimeter dimensions, sleeve formats, and card counts) without manual user data entry, with explicit confirmation for zero-card games.

**Independent Test**: Open game details for Catan, Pandemic, Wingspan, Scythe, and Azul. Verify card set specs are pre-populated and Azul indicates that no cards/sleeves are needed.

### Tests for User Story 1
- [X] T005 [P] [US1] Add unit tests for expanded community sleeve catalog and zero-card game detection in tests/unit/preloaded-content.test.ts

### Implementation for User Story 1
- [X] T006 [P] [US1] Expand community sleeve specifications in src/data/community-sleeves-catalog.ts to cover popular titles and zero-card games
- [X] T007 [US1] Update sleeve auto-seeding logic in src/services/sleeve-manager.service.ts to handle zero-card games and bulk collection pre-population
- [X] T008 [US1] Update game sleeve presentation in src/components/sleeves/game-sleeve-info.tsx to display pre-populated card sets and explicit zero-card component notices

**Checkpoint**: User Story 1 is fully functional. Users can consult sleeve requirements for any game in their collection without typing.

---

## Phase 4: User Story 2 - Bundled Brazilian Portuguese (PT-BR) Rulebooks (Priority: P1)

**Goal**: Provide Brazilian Portuguese (PT-BR) PDF rulebooks bundled inside the repository assets folder, automatically linked to games in SQLite with status READY for immediate offline reading.

**Independent Test**: Select a game with a bundled rulebook in game details. Tap to view the manual and verify the PT-BR PDF renders in the offline reader.

### Tests for User Story 2
- [X] T009 [P] [US2] Add unit tests for bundled PDF rulebook detection, MD5 hashing, and database registration in tests/unit/preloaded-content.test.ts

### Implementation for User Story 2
- [X] T010 [P] [US2] Commit valid Brazilian Portuguese PDF rulebooks into assets/rulebooks/ (e.g. catan-regras-ptbr.pdf, azul-regras-ptbr.pdf, pandemic-regras-ptbr.pdf, wingspan-regras-ptbr.pdf)
- [X] T011 [US2] Implement PreloadedRulebookService in src/services/preloaded-rulebook.service.ts to automatically register bundled PT-BR manuals into the SQLite rulebooks table
- [X] T012 [US2] Connect PreloadedRulebookService initialization into app startup in app/_layout.tsx and collection sync pipeline
- [X] T013 [US2] Update rulebook listing sheet in src/components/rulebooks/rulebook-list-sheet.tsx to highlight the verified Brazilian Portuguese manual for one-tap reading

**Checkpoint**: User Story 2 is fully functional. Bundled Portuguese rulebooks are automatically registered and viewable offline.

---

## Phase 5: User Story 3 - Streamlined Consultation Experience Without Registration Friction (Priority: P2)

**Goal**: Align all detail screens and collection actions to focus purely on consultation and reference, eliminating redundant creation/registration flows.

**Independent Test**: Navigate collection views and game detail sheets. Verify that sleeve consultation, rulebook reading, play logs, and 3D shelf inspection are primary, intuitive, and unobstructed.

### Implementation for User Story 3
- [X] T014 [US3] Streamline game detail layout in src/components/game-detail-sheet.tsx to prioritize immediate sleeve and rulebook consultation
- [X] T015 [US3] Ensure collection and shelf views present read-only consultation affordances clearly without empty-state registration friction

**Checkpoint**: User Story 3 is complete. The application operates as a polished consultation companion.

---

## Phase 6: Polish, Verification & Quality Gates

**Purpose**: Cross-cutting verification, TypeScript compilation, full regression testing, and design system audit.

- [X] T016 Run full test suite with Jest across all 29 test suites to guarantee zero regression
- [X] T017 Run TypeScript compiler check via npm run typecheck with strict mode
- [X] T018 Run Impeccable design system audit via npm run ui:audit to verify contrast and token adherence

---

## Dependencies & Completion Order

```text
Phase 1 (Setup) ──> Phase 2 (Foundational) ──┬──> Phase 3 (US1: Sleeves Pre-population)
                                             └──> Phase 4 (US2: Bundled PT-BR Rulebooks)
                                                          │
                                                          ▼
                                             Phase 5 (US3: Consultation UX)
                                                          │
                                                          ▼
                                             Phase 6 (Polish & Verification)
```

## Parallel Execution Opportunities

- T001 and T002 can run in parallel.
- T006 ([US1] Community sleeves expansion) and T010 ([US2] PDF asset placement) can run in parallel.
- T005 and T009 test suites can be developed in parallel.

## MVP Implementation Strategy

1. **MVP Scope (Phase 1 to Phase 3)**: Complete pre-populated sleeve catalog so every game opened immediately displays accurate sleeve specifications.
2. **Increment 2 (Phase 4)**: Bundle Brazilian Portuguese PDFs in `assets/rulebooks/` and enable one-tap offline rulebook reading.
3. **Increment 3 (Phase 5 & 6)**: Streamline consultation UI and execute all quality gates.
