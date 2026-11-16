# Implementation Plan: Pre-populated Sleeves & Brazilian Portuguese Rulebooks

**Branch**: `specs/009-prepopulated-sleeves-manuals` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-prepopulated-sleeves-manuals/spec.md`

## Summary

Enable instantaneous, friction-free collection consultation by providing pre-populated card sleeve requirements for all supported collection games and bundling curated Brazilian Portuguese (PT-BR) PDF rulebooks directly inside the repository (`assets/rulebooks/`). Eliminate manual game registration overhead and ensure 100% offline access to sleeve specifications and official Portuguese manuals.

## Technical Context

**Language/Version**: TypeScript 5.3+ (Strict Mode), Node.js 20+

**Primary Dependencies**: React 19, React Native 0.88, Expo SDK 58 (`expo-file-system/legacy`, `expo-sqlite`, `expo-router`), `@react-three/fiber` 9.8+, `drizzle-orm` 0.36+

**Storage**: Local SQLite via `expo-sqlite` and `Drizzle ORM` (`game_sleeves` and `rulebooks` tables) + filesystem (`assets/rulebooks/*.pdf`)

**Testing**: Jest 29 + ts-jest, 28 test suites, unit & integration tests

**Target Platform**: Android (Expo Go / Standalone), iOS, Web (React Native Web / Three.js)

**Project Type**: Mobile Application (Expo / React Native)

**Performance Goals**: Instant display (<100ms) of sleeve requirements; PDF reader opens first page in <1s

**Constraints**: 100% Offline-First (Constitution Principle I), Zero data loss for user notes and ratings (FR-020), Bundled PDFs must be valid `%PDF-1.4` files

**Scale/Scope**: Pre-populated sleeve specifications covering popular titles + bundled Portuguese manuals for key games

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I: Offline-First & Local Data Ownership**: Sleeves and rulebooks are stored locally in SQLite and repository assets; 100% functional without internet connection.
- [x] **Principle II: Procedural 3D Virtual Shelf & Real-Scale Immersion**: No impact on 3D procedural generation or Kallax rendering bounds.
- [x] **Principle III: Resilient Asynchronous External Integrations**: Seeding is idempotent and decoupled from external BGG network requests.
- [x] **Principle IV: Modular Layered Architecture**: Catalog datasets (`src/data/`), services (`src/services/`), repositories (`src/db/`), and UI components (`src/components/`) remain cleanly separated.
- [x] **Principle V: Type Safety, Performance Budgets & Test Discipline**: Strict TypeScript contracts, comprehensive Jest tests, zero untyped `any`.

## Project Structure

### Documentation (this feature)

```text
specs/009-prepopulated-sleeves-manuals/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Architectural research & decisions
├── data-model.md        # Entities and database mapping
├── quickstart.md        # Validation scenarios
├── contracts/           # TypeScript contract definitions
│   └── preloaded-content-contract.ts
└── checklists/          # Quality checklists
    └── requirements.md
```

### Source Code Layout

```text
assets/
└── rulebooks/                           # Bundled Brazilian Portuguese (PT-BR) PDF manuals
    ├── catan-regras-ptbr.pdf
    ├── azul-regras-ptbr.pdf
    ├── pandemic-regras-ptbr.pdf
    └── wingspan-regras-ptbr.pdf

src/
├── data/
│   ├── community-sleeves-catalog.ts     # Expanded sleeve specifications catalog
│   └── bundled-rulebooks-catalog.ts     # Manifest of bundled PT-BR rulebooks
├── services/
│   ├── sleeve-manager.service.ts        # Idempotent sleeve auto-seeding
│   └── preloaded-rulebook.service.ts    # Bundled PDF asset detection and registration
├── components/
│   ├── sleeves/
│   │   └── game-sleeve-info.tsx         # Zero-card game notice & pre-filled display
│   └── rulebooks/
│       └── rulebook-list-sheet.tsx      # Direct one-tap PT-BR manual opening
tests/
└── unit/
    └── preloaded-content.test.ts        # Automated unit and contract tests
```

## Structure Decision

Reuses existing clean architecture in `src/data/` for immutable catalogs, `src/services/` for business logic and database seeding, and `assets/rulebooks/` for committed repository PDF files.

## Complexity Tracking

*No constitution violations. All solutions adhere to existing layered design.*
