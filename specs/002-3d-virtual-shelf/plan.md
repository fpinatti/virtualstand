# Implementation Plan: Interactive 3D Virtual Shelf with Real-Scale Procedural Boxes

**Branch**: `002-3d-virtual-shelf` | **Date**: 2026-11-14 | **Spec**: [specs/002-3d-virtual-shelf/spec.md](spec.md)

**Input**: Feature specification from `specs/002-3d-virtual-shelf/spec.md`

## Summary

Implement an interactive 3D virtual bookcase using `@react-three/fiber/native` and `three` integrated with Expo GL. The shelf dynamically packs physical board game boxes into Kallax-style modular cubbies using procedural `BoxGeometry` sized according to real-world dimensions stored in the local SQLite database. Exposed spines are rendered procedurally with dominant color extraction and legible typography, while native raycasting and gestures empower collectors to pull out, rotate, and inspect boxes at a fluid 60 FPS.

## Technical Context

**Language/Version**: TypeScript 5.x / React Native / Expo SDK 52+

**Primary Dependencies**: `@react-three/fiber`, `three`, `expo-gl`, `react-native-gesture-handler`, `react-native-reanimated`

**Storage**: Reads cached box dimensions (`box_dimensions`), metadata (`games`), and ownership status (`collection_items`) from local SQLite via Drizzle ORM

**Testing**: Jest, `ts-jest` for spatial layout and packing tests

**Target Platform**: iOS, Android, and Web (hybrid)

**Project Type**: Mobile 3D Graphics Component

**Performance Goals**: Stable 60 FPS rendering on standard mobile devices; <1.5s scene setup time for up to 200 games; touch raycast latency < 16ms

**Constraints**: Procedural generation (no pre-modeled static `.glb` files per title); 1 Three.js unit = 10 cm scale; texture memory bound <= 1024x1024; automatic texture/geometry disposal on unmount to prevent GPU memory leaks

**Scale/Scope**: Supports personal collections from 1 to 200+ games, dynamically organizing bookcases from $1 \times 1$ to $4 \times 4+$ cubbies

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Offline-First & Local Data Ownership**: PASS. All box geometries, cached cover textures, and metadata load directly from the local SQLite database and `expo-file-system`. Zero remote network dependencies are required to render the 3D scene.
- **Principle II: Procedural 3D Virtual Shelf & Real-Scale Immersion**: PASS. Box meshes are generated procedurally at runtime with `BoxGeometry(width, height, depth)` scaled strictly to physical dimensions ($1\text{ unit} = 10\text{ cm}$). Spines are generated dynamically with dominant color extraction and typography. Raycast and touch events execute smoothly without blocking the JS loop.
- **Principle III: Resilient Asynchronous External Integrations**: PASS. Integrates seamlessly with dimensions fetched in Feature 001; missing dimensions automatically receive verified fallback values.
- **Principle IV: Modular Layered Architecture & Separation of Concerns**: PASS. 3D presentation (`src/components/shelf-3d/`) is strictly isolated from data access (`src/db/repositories/`) and spatial packing math (`src/services/shelf-layout.service.ts`).
- **Principle V: Type Safety, Performance Budgets & Test Discipline**: PASS. 100% strict TypeScript types; automated unit tests for spatial packing algorithms and coordinate boundary calculations before UI integration.

## Project Structure

### Documentation (this feature)

```text
specs/002-3d-virtual-shelf/
├── plan.md              # Implementation plan (this file)
├── research.md          # 3D viewport decisions, scaling rules, multi-materials
├── data-model.md        # Spatial coordinate conventions & interaction state machine
├── quickstart.md        # Automated tests and interactive validation scenarios
├── contracts/           # Layout and 3D box interface contracts
│   ├── shelf-layout-contract.ts
│   └── box-3d-contract.ts
└── checklists/
    └── requirements.md  # Spec quality validation checklist
```

### Source Code (repository root)

```text
app/
├── (tabs)/
│   ├── _layout.tsx                   # Adds 3D Shelf tab icon & route
│   └── shelf.tsx                     # Main 3D Shelf screen container

src/
├── services/
│   ├── shelf-layout.service.ts       # Mathematical cubby packing & coordinate solver
│   └── spine-generator.service.ts    # Procedural canvas spine textures & color extraction
├── components/
│   └── shelf-3d/
│       ├── shelf-scene.tsx           # R3F Canvas root with lighting & camera
│       ├── bookcase-mesh.tsx         # Modular wooden/neutral shelf dividers
│       └── game-box-mesh.tsx         # Procedural multi-material box with pull-out animation
└── hooks/
    └── use-shelf-collection.ts       # Hook querying games with dimensions for 3D shelf

tests/
└── unit/
    ├── shelf-layout.test.ts          # Unit tests for packing math and cubby bounds
    └── spine-generator.test.ts       # Unit tests for spine color and label sizing
```

**Structure Decision**: Clean componentization separating mathematical spatial layout (`shelf-layout.service.ts`), 3D mesh rendering (`src/components/shelf-3d/`), and data-fetching hooks (`use-shelf-collection.ts`).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations detected. All architectural decisions strictly satisfy the Constitution.*
