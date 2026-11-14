# Implementation Plan: Board Game Card Sleeve Inventory and Sizing Catalog

**Branch**: `003-card-sleeve-manager` | **Date**: 2026-11-14 | **Spec**: [specs/003-card-sleeve-manager/spec.md](spec.md)

**Input**: Feature specification from `specs/003-card-sleeve-manager/spec.md`

## Summary

Implement an offline-first card sleeve management subsystem comprising game-level sleeve requirement tracking (`game_sleeves`), user spare stock inventory (`sleeve_inventory`), a pre-populated offline community catalog mapping board games to standard card sleeve sizes, and an automated shopping list calculator that determines net pack deficits across the collection.

## Technical Context

**Language/Version**: TypeScript 5.x / React Native / Expo SDK 52+

**Primary Dependencies**: `expo-sqlite`, `drizzle-orm`, Expo Router, React Native

**Storage**: Local SQLite database tables (`game_sleeves`, `sleeve_inventory`) via Drizzle ORM

**Testing**: Jest, `ts-jest` for shopping calculator algorithms and catalog lookup tests

**Target Platform**: iOS, Android, and Web

**Project Type**: Mobile Application Subsystem

**Performance Goals**: Shopping list calculation across 100+ games in < 50ms; instant offline responsiveness

**Constraints**: 100% offline-capable; zero network dependencies for catalog lookup or stock math

**Scale/Scope**: Manages hundreds of card sleeve specifications and spare stock records per user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Offline-First & Local Data Ownership**: PASS. All sleeve requirements, spare stock, and shopping calculations persist in local SQLite tables. Built-in community catalog is bundled offline.
- **Principle II: Procedural 3D Virtual Shelf & Real-Scale Immersion**: PASS. Sleeve completion badges integrate into the 3D shelf box inspector modal (`GameDetailSheet`).
- **Principle III: Resilient Asynchronous External Integrations**: PASS. Solves BGG's lack of structured sleeve endpoints using local datasets without fragile scraping.
- **Principle IV: Modular Layered Architecture & Separation of Concerns**: PASS. Service logic (`src/services/sleeve-manager.service.ts`) is strictly separated from database repositories (`src/db/repositories/sleeve.repository.ts`) and presentation components (`src/components/sleeves/`).
- **Principle V: Type Safety, Performance Budgets & Test Discipline**: PASS. 100% strict TypeScript types; automated unit tests for deficit math and catalog matching before UI integration.

## Project Structure

### Documentation (this feature)

```text
specs/003-card-sleeve-manager/
├── plan.md              # Implementation plan (this file)
├── research.md          # Multi-size design, community catalog, shopping algorithms
├── data-model.md        # Database schemas and ER diagrams
├── quickstart.md        # Validation scenarios and testing instructions
├── contracts/           # Service and model interfaces
│   └── sleeve-contract.ts
└── checklists/
    └── requirements.md  # Spec quality validation checklist
```

### Source Code (repository root)

```text
app/
├── (tabs)/
│   ├── _layout.tsx                   # Adds "Sleeves" tab route
│   └── sleeves.tsx                   # Main Sleeve Hub (Inventory & Shopping List)

src/
├── data/
│   └── community-sleeves-catalog.ts  # Pre-bundled offline catalog mapping bggId -> sleeves
├── db/
│   ├── schema.ts                     # Adds game_sleeves and sleeve_inventory schemas
│   └── repositories/
│       └── sleeve.repository.ts      # CRUD queries for sleeves, stock, and demands
├── services/
│   └── sleeve-manager.service.ts     # Shopping list aggregator & inventory deduction math
├── components/
│   ├── sleeves/
│   │   ├── game-sleeve-manager.tsx   # Modal for viewing/editing a game's card sleeves
│   │   ├── inventory-list.tsx        # Owned spare stock manager
│   │   └── shopping-list-view.tsx    # Aggregated buy list with pack calculations
│   └── game-detail-sheet.tsx         # Links sleeve summary badge & modal trigger
└── hooks/
    └── use-sleeves.ts                # React hook for inventory and shopping state

tests/
└── unit/
    ├── sleeve-calculator.test.ts     # Unit tests for pack deficit and surplus math
    └── sleeve-catalog.test.ts        # Unit tests for community catalog matching
```

**Structure Decision**: Standard modular design grouping database persistence (`src/db/repositories/sleeve.repository.ts`), calculation services (`src/services/sleeve-manager.service.ts`), and UI components (`src/components/sleeves/`).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations detected. All architectural decisions strictly satisfy the Constitution.*
