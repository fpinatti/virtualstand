# Tasks: Interactive 3D Virtual Shelf with Real-Scale Procedural Boxes

**Input**: Design documents from `specs/002-3d-virtual-shelf/` (`plan.md`, `spec.md`, `data-model.md`, `contracts/`, `research.md`, `quickstart.md`)

**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `contracts/`, `research.md`, `quickstart.md`

**Tests**: Test tasks included per Constitution Principle V (TDD for spatial math, spine generator, and interaction state machine).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 3D library installation, Three.js / Expo GL environment configuration, and contract definitions

- [x] T001 Install 3D dependencies (@react-three/fiber, three, expo-gl, @types/three) in package.json
- [x] T002 [P] Configure Jest mocks for Three.js and Expo GL in jest.config.js
- [x] T003 [P] Re-export 3D contracts and spatial types in src/components/shelf-3d/types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Mathematical packing engine, cubby spatial solver, and SQLite shelf data access hook

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement spatial packing solver (ShelfLayoutEngine) calculating cubby grid bounds, 1 unit = 10cm conversions, and coordinate offsets in src/services/shelf-layout.service.ts
- [x] T005 [P] Write unit tests for spatial layout and packing solver in tests/unit/shelf-layout.test.ts
- [x] T006 [P] Implement useShelfCollection React hook querying owned games with verified/fallback box dimensions from SQLite in src/hooks/use-shelf-collection.ts

**Checkpoint**: Core foundation ready — spatial packing algorithm verified and collection data query ready.

---

## Phase 3: User Story 1 - Real-Scale 3D Shelf Visualization of User Collection (Priority: P1) 🎯 MVP

**Goal**: Render a modular 3D bookcase in Three.js with boxes sized to real-world proportions packed inside cubbies, with orbit/pan camera controls at 60 FPS offline.

**Independent Test**: Open the 3D Shelf tab; confirm games appear upright in shelf cubbies with realistic proportions, and camera navigates smoothly without lag.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Write unit tests for box geometry scaling and boundary clamping in tests/unit/box-geometry.test.ts

### Implementation for User Story 1

- [x] T008 [P] [US1] Implement modular bookcase 3D mesh (BookcaseMesh) rendering cubby dividers and back panel in src/components/shelf-3d/bookcase-mesh.tsx
- [x] T009 [US1] Implement procedural box 3D mesh (GameBoxMesh) with BoxGeometry(width, height, depth) and multi-material faces in src/components/shelf-3d/game-box-mesh.tsx
- [x] T010 [US1] Implement 3D canvas viewport component (ShelfScene) with lighting, perspective camera, and pan/zoom controls in src/components/shelf-3d/shelf-scene.tsx
- [x] T011 [US1] Add 3D Shelf navigation tab in app/(tabs)/_layout.tsx and implement container screen in app/(tabs)/shelf.tsx

**Checkpoint**: User Story 1 (MVP) is fully functional and testable independently. The 3D bookcase renders games with real-world proportions.

---

## Phase 4: User Story 2 - Legible Game Spines with Dynamic Color & Title Generation (Priority: P2)

**Goal**: Ensure games standing upright on the shelf have clearly readable titles on their exposed spines, with harmonized theme colors.

**Independent Test**: View upright games in a shelf compartment; verify spine faces show game titles in high contrast on matching background tones.

### Tests for User Story 2

- [x] T012 [P] [US2] Write unit tests for spine text formatting, font scaling, and color contrast calculation in tests/unit/spine-generator.test.ts

### Implementation for User Story 2

- [x] T013 [P] [US2] Implement spine texture generator service (SpineGeneratorService) producing offscreen canvas/data-URIs with titles and theme colors in src/services/spine-generator.service.ts
- [x] T014 [US2] Integrate dynamic spine textures into multi-material array of GameBoxMesh in src/components/shelf-3d/game-box-mesh.tsx

**Checkpoint**: User Stories 1 and 2 work together. Spines are clearly readable and aesthetically harmonized.

---

## Phase 5: User Story 3 - Tactile 3D Box Interaction, Pull-Out Animation & Inspection (Priority: P3)

**Goal**: Tapping a box smoothly pulls it out along +Z, allows 360-degree rotation inspection via touch gestures, and opens game details.

**Independent Test**: Tap any game box; verify it slides forward, drag to rotate in 3D, tap to open details sheet, and tap background to return the box to the shelf.

### Tests for User Story 3

- [x] T015 [P] [US3] Write unit tests for box interaction state transitions and coordinate interpolation in tests/unit/box-interaction.test.ts

### Implementation for User Story 3

- [x] T016 [US3] Implement raycast pointer selection and spring position interpolation in src/components/shelf-3d/game-box-mesh.tsx
- [x] T017 [P] [US3] Implement touch drag rotation controls for extracted boxes in src/components/shelf-3d/box-rotation-controls.tsx
- [x] T018 [US3] Integrate extracted box inspection tap with GameDetailSheet in app/(tabs)/shelf.tsx

**Checkpoint**: All three user stories are complete. The shelf offers rich 3D inspection and direct game management actions.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, GPU resource disposal, and empty state handling

- [x] T019 [P] Implement GPU resource disposal (geometry.dispose(), material.dispose()) on scene unmount in src/components/shelf-3d/shelf-scene.tsx
- [x] T020 [P] Add empty state overlay prompting user to import games if local collection has 0 titles in app/(tabs)/shelf.tsx
- [x] T021 Verify full test suite and strict TypeScript compilation (tsc --noEmit) across the entire codebase

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion (T004-T006) — MVP milestone
- **User Story 2 (Phase 4)**: Depends on User Story 1 mesh implementation (T009)
- **User Story 3 (Phase 5)**: Depends on User Story 1 (T009) and integrates with GameDetailSheet
- **Polish (Phase 6)**: Depends on all target user stories being complete

---

## Parallel Opportunities

```bash
# Phase 1 Parallel Setup
Task T002: Configure Jest mocks in jest.config.js
Task T003: Re-export 3D contracts in src/components/shelf-3d/types.ts

# Phase 2 Parallel Tasks
Task T005: Write unit tests in tests/unit/shelf-layout.test.ts
Task T006: Implement useShelfCollection hook in src/hooks/use-shelf-collection.ts

# User Story 1 Parallel Tasks
Task T007: Write unit tests in tests/unit/box-geometry.test.ts
Task T008: Implement bookcase mesh in src/components/shelf-3d/bookcase-mesh.tsx

# User Story 2 Parallel Tasks
Task T012: Write unit tests in tests/unit/spine-generator.test.ts
Task T013: Implement spine generator in src/services/spine-generator.service.ts

# User Story 3 Parallel Tasks
Task T015: Write unit tests in tests/unit/box-interaction.test.ts
Task T017: Implement rotation controls in src/components/shelf-3d/box-rotation-controls.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup (T001-T003).
2. Complete Phase 2: Foundational (T004-T006) — unlocks 3D layout math.
3. Complete Phase 3: User Story 1 (T007-T011).
4. **STOP and VALIDATE**: Run test suite and inspect 3D bookcase rendering games with proportional boxes at 60 FPS.
5. At this milestone, you have a working, deliverable 3D virtual shelf.

### Incremental Delivery
1. **Increment 1**: MVP (Setup + Foundation + User Story 1) $\rightarrow$ Proportional 3D shelf visualization.
2. **Increment 2**: User Story 2 $\rightarrow$ Legible spines with dynamic color extraction.
3. **Increment 3**: User Story 3 $\rightarrow$ Interactive box pull-out, 360° rotation, and game detail modal.
4. **Increment 4**: Polish $\rightarrow$ Memory disposal, empty state, full test verification.

