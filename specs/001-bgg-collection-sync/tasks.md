# Tasks: BGG Collection Import and Resilient Synchronization

**Input**: Design documents from `specs/001-bgg-collection-sync/` (`plan.md`, `spec.md`, `data-model.md`, `contracts/`, `research.md`, `quickstart.md`)

**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `contracts/`, `research.md`, `quickstart.md`

**Tests**: Test tasks are included per Constitution Principle V (TDD discipline for parsers, retry engines, and reconciliation).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency installation, and baseline configuration

- [x] T001 Initialize React Native Expo TypeScript project structure and configure strict type checking in tsconfig.json
- [x] T002 Configure project dependencies (expo, expo-router, expo-sqlite, drizzle-orm, fast-xml-parser, zod, expo-file-system) and dev dependencies (drizzle-kit, jest, ts-jest, @types/jest) in package.json
- [x] T003 [P] Configure Jest testing environment and mocks for Expo SQLite and FileSystem in jest.config.js
- [x] T004 [P] Configure Drizzle ORM SQLite migration runner in drizzle.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schemas, network client types, error handling, and application root providers

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Define Drizzle ORM schemas for games, collection_items, box_dimensions, and sync_logs tables in src/db/schema.ts
- [x] T006 [P] Implement Expo SQLite client provider, connection lifecycle, and migration execution in src/db/client.ts
- [x] T007 [P] Define API domain error types, HTTP status codes, and sync exception classes in src/api/types.ts
- [x] T008 [P] Implement exponential backoff algorithm with random jitter and max threshold calculations in src/api/backoff.ts
- [x] T009 [P] Setup Root Expo Router layout with SQLite context provider and safe area layout in app/_layout.tsx

**Checkpoint**: Core foundation ready — database layer initialized and base utilities verified.

---

## Phase 3: User Story 1 - Initial Collection Import from BoardGameGeek (Priority: P1) 🎯 MVP

**Goal**: A user can enter their BGG username, initiate an import that handles HTTP 202 queues with reassuring feedback, save all games and personal ratings locally in SQLite, and browse their entire collection offline.

**Independent Test**: Enter a valid BGG username, initiate import, observe progress during HTTP 202 backoff polling, verify all titles and ratings are persisted in SQLite, and browse the collection smoothly in airplane mode.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T010 [P] [US1] Write unit tests for exponential backoff delay calculation, jitter boundaries, and max attempt caps in tests/unit/bgg-backoff.test.ts
- [x] T011 [P] [US1] Write unit tests for BGG collection XML parser fixtures (handling single-item, multi-item, and empty collections) in tests/unit/bgg-xml-parser.test.ts
- [x] T012 [P] [US1] Write integration tests for collection import and initial SQLite persistence in tests/integration/collection-import.test.ts

### Implementation for User Story 1

- [x] T013 [P] [US1] Implement BGG XML collection response parser converting XML payload into typed BggCollectionItemRaw array in src/api/bgg-xml-parser.ts
- [x] T014 [US1] Implement BggClient with HTTP 202 backoff polling, rate limiter (1500ms delay), and fetchUserCollection method in src/api/bgg-client.ts
- [x] T015 [P] [US1] Implement thumbnail image caching service using expo-file-system in src/services/image-cache.service.ts
- [x] T016 [US1] Implement GameRepository and CollectionRepository for batch inserting canonical games and collection items in src/db/repositories/game.repository.ts and src/db/repositories/collection.repository.ts
- [x] T017 [US1] Implement CollectionSyncService orchestrating collection retrieval, progress events, image cache, and batch SQLite storage in src/services/collection-sync.service.ts
- [x] T018 [P] [US1] Implement useSync and useCollection React hooks for data querying and synchronization lifecycle in src/hooks/use-sync.ts and src/hooks/use-collection.ts
- [x] T019 [P] [US1] Implement SyncProgressModal component displaying live stage progress, attempt count, and retry feedback in src/components/sync-progress-modal.tsx
- [x] T020 [US1] Implement main collection browsing screen with search bar, offline grid/list view, and import trigger in app/(tabs)/collection.tsx
- [x] T021 [US1] Implement settings screen for BGG username input and initial collection import trigger in app/(tabs)/settings.tsx

**Checkpoint**: User Story 1 (MVP) is fully functional and testable independently. The app imports and browses collections offline.

---

## Phase 4: User Story 2 - Incremental Sync with Local Enrichment Preservation (Priority: P2)

**Goal**: A user who updates ratings or adds games on BGG can trigger an incremental sync that reconciles remote changes without overwriting local custom notes, tags, or attachments.

**Independent Test**: Modify a game rating on BGG, add a custom note to that game locally in the app, execute a sync, and confirm the rating updates while the local note is preserved.

### Tests for User Story 2

- [x] T022 [P] [US2] Write unit tests for local enrichment preservation during upsert reconciliation in tests/unit/reconciliation.test.ts
- [x] T023 [P] [US2] Write integration tests for incremental sync diffing (additions, modifications, deletions) in tests/integration/incremental-sync.test.ts

### Implementation for User Story 2

- [x] T024 [US2] Update CollectionRepository with diff-based upsert logic that updates BGG fields (rating, bgg_comment, status) while preserving local_notes and custom_tags in src/db/repositories/collection.repository.ts
- [x] T025 [US2] Add audit logging to sync_logs table (recording start, end, items inserted, items updated, failure states) in src/services/collection-sync.service.ts
- [x] T026 [P] [US2] Implement local game detail view with personal notes editor and custom tag manager in src/components/game-detail-sheet.tsx
- [x] T027 [US2] Integrate "Sync Now" incremental refresh button and last-synced timestamp indicator in app/(tabs)/collection.tsx

**Checkpoint**: User Stories 1 and 2 work seamlessly together with complete data safety for local enrichments.

---

## Phase 5: User Story 3 - Automatic Physical Box Dimension Extraction (Priority: P3)

**Goal**: Automatically retrieve box dimensions from BGG versions (/thing?id={ids}&versions=1) in batches of 20, convert inches to centimeters, assign category fallback dimensions when absent, and store in box_dimensions.

**Independent Test**: Import a game with documented physical editions; verify dimensions are saved in centimeters and displayed, and verify missing dimensions receive estimated fallbacks.

### Tests for User Story 3

- [x] T028 [P] [US3] Write unit tests for physical version XML parsing and inch-to-cm conversion in tests/unit/dimension-parser.test.ts
- [x] T029 [P] [US3] Write unit tests for box dimension fallback categorization (standard Euro, card game, big box) in tests/unit/dimension-calculator.test.ts

### Implementation for User Story 3

- [x] T030 [P] [US3] Implement BggThingParser to extract boardgameversion width, length, depth, and weight in src/api/bgg-xml-parser.ts
- [x] T031 [US3] Add batched fetchThingVersions method to BggClient with 20-item chunking in src/api/bgg-client.ts
- [x] T032 [P] [US3] Implement DimensionCalculatorService for unit conversions (inches to cm) and standard category fallbacks in src/services/dimension-calculator.service.ts
- [x] T033 [US3] Integrate box dimension fetching and persistence into CollectionSyncService pipeline in src/services/collection-sync.service.ts
- [x] T034 [P] [US3] Implement physical dimensions viewer and manual dimension calibration editor in src/components/box-dimension-editor.tsx

**Checkpoint**: All three user stories are fully implemented and testable. Games have accurate physical dimensions for 3D rendering.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, offline reachability monitoring, and quickstart scenario validation

- [x] T035 [P] Implement network reachability monitoring with automatic offline detection in src/services/network.service.ts
- [x] T036 [P] Add database query indexing on games(title), collection_items(bgg_id), and collection_items(status_own) in src/db/schema.ts
- [x] T037 Execute and verify end-to-end quickstart validation scenarios (A: Initial Import, B: Incremental Sync, C: Network Disruption) per specs/001-bgg-collection-sync/quickstart.md
- [x] T038 Verify strict TypeScript compilation with zero errors (tsc --noEmit) and lint compliance across the codebase

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion (T005-T009) — MVP milestone
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (T010-T021)
- **User Story 3 (Phase 5)**: Depends on User Story 1 completion; can proceed in parallel with or after User Story 2
- **Polish (Phase 6)**: Depends on all target user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent of US2/US3. Requires only Foundational infrastructure.
- **User Story 2 (P2)**: Builds upon US1 repositories and sync service to add reconciliation and local notes protection.
- **User Story 3 (P3)**: Extends US1 sync pipeline to enrich imported games with physical dimensions from BGG `/thing?versions=1`.

---

## Parallel Opportunities

```bash
# Phase 1 Parallel Setup
Task T003: Configure Jest testing environment in jest.config.js
Task T004: Configure Drizzle ORM in drizzle.config.ts

# Phase 2 Parallel Foundational Tasks
Task T006: Implement SQLite client in src/db/client.ts
Task T007: Define API domain error types in src/api/types.ts
Task T008: Implement exponential backoff in src/api/backoff.ts
Task T009: Setup Root Expo Router layout in app/_layout.tsx

# User Story 1 Parallel Tests
Task T010: Write unit tests in tests/unit/bgg-backoff.test.ts
Task T011: Write unit tests in tests/unit/bgg-xml-parser.test.ts
Task T012: Write integration tests in tests/integration/collection-import.test.ts

# User Story 1 Parallel Components
Task T013: Implement XML parser in src/api/bgg-xml-parser.ts
Task T015: Implement image cache in src/services/image-cache.service.ts
Task T018: Implement React hooks in src/hooks/use-sync.ts and src/hooks/use-collection.ts
Task T019: Implement SyncProgressModal in src/components/sync-progress-modal.tsx

# User Story 2 Parallel Tasks
Task T022: Write unit tests in tests/unit/reconciliation.test.ts
Task T023: Write integration tests in tests/integration/incremental-sync.test.ts
Task T026: Implement game detail sheet in src/components/game-detail-sheet.tsx

# User Story 3 Parallel Tasks
Task T028: Write unit tests in tests/unit/dimension-parser.test.ts
Task T029: Write unit tests in tests/unit/dimension-calculator.test.ts
Task T030: Implement version parser in src/api/bgg-xml-parser.ts
Task T032: Implement dimension service in src/services/dimension-calculator.service.ts
Task T034: Implement dimension editor in src/components/box-dimension-editor.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup (T001-T004).
2. Complete Phase 2: Foundational (T005-T009) — **CRITICAL**: unlocks user stories.
3. Complete Phase 3: User Story 1 (T010-T021).
4. **STOP and VALIDATE**: Run test suite and execute Scenario A from `quickstart.md` (import collection, test offline browsing).
5. At this milestone, you have a working, deliverable MVP app that imports collections from BGG and operates 100% offline.

### Incremental Delivery
1. **Increment 1**: MVP (Setup + Foundation + User Story 1) $\rightarrow$ Full offline collection viewing.
2. **Increment 2**: User Story 2 $\rightarrow$ Incremental sync + local notes preservation.
3. **Increment 3**: User Story 3 $\rightarrow$ Physical box dimensions ready for 3D virtual shelf.
4. **Increment 4**: Polish $\rightarrow$ Query indexes, network reachability, end-to-end validation.

