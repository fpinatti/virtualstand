# Implementation Plan: BGG Collection Import and Resilient Synchronization

**Branch**: `001-bgg-collection-sync` | **Date**: 2026-11-14 | **Spec**: [specs/001-bgg-collection-sync/spec.md](spec.md)

**Input**: Feature specification from `specs/001-bgg-collection-sync/spec.md`

## Summary

Implement an offline-first collection import and incremental synchronization engine powered by BoardGameGeek's XMLAPI2. The solution features a resilient asynchronous HTTP client that gracefully resolves BGG's HTTP 202 queuing using exponential backoff with jitter, extracts canonical game metadata and physical box dimensions (`boardgameversion`), and reconciles records into a local SQLite database via Drizzle ORM while strictly preserving user-created local notes and attachments.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+

**Primary Dependencies**: React Native, Expo (SDK 52+), Expo Router, `expo-sqlite`, `drizzle-orm`, `fast-xml-parser` (v4.x), `zod`

**Storage**: Local SQLite database via `expo-sqlite` and `drizzle-orm`, with image caching on `expo-file-system`

**Testing**: Jest, `@testing-library/react-native`, `ts-jest`

**Target Platform**: iOS, Android, and Web (Expo hybrid mobile application)

**Project Type**: Mobile Application

**Performance Goals**: 100-game collection initial import < 45 seconds; local search & filter across 500 games < 100 milliseconds; 60 FPS UI responsiveness during background synchronization

**Constraints**: 100% offline-capable; zero UI thread blocking during XML parsing or SQLite batch writes; respect BGG rate limits (minimum 1,500 ms between requests, exponential backoff on HTTP 202/429)

**Scale/Scope**: Supports personal board game collections from 1 to 2,000+ titles, with local metadata and thumbnail caching (~50MB to 150MB local footprint)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Offline-First & Local Data Ownership**: PASS. All collection queries, filtering, and detail inspections run directly against local SQLite tables (`games`, `collection_items`, `box_dimensions`). Remote sync functions strictly as an upstream reconciler via non-blocking background transactions.
- **Principle II: Procedural 3D Virtual Shelf & Real-Scale Immersion**: PASS. Physical box dimensions (`width_cm`, `height_cm`, `depth_cm`, `weight_kg`) are pre-fetched from BGG versions (`<item type="boardgameversion">`) and stored alongside verified/estimated flags to immediately power procedural 3D box generation.
- **Principle III: Resilient Asynchronous External Integrations**: PASS. Dedicated `BggClient` handles HTTP 202 queuing with deterministic exponential backoff (2s initial, 1.5x multiplier, random jitter, max 8 attempts), respects rate limits, and uses pure TypeScript XML parsing (`fast-xml-parser`).
- **Principle IV: Modular Layered Architecture & Separation of Concerns**: PASS. Architecture enforces strict separation: Network Client (`src/api/`) $\rightarrow$ Sync Services (`src/services/`) $\rightarrow$ Persistence Repositories (`src/db/`) $\rightarrow$ UI State Hooks & Components (`src/hooks/`, `src/components/`, `app/`).
- **Principle V: Type Safety, Performance Budgets & Test Discipline**: PASS. Zero untyped `any`s; 100% strict TypeScript; Drizzle ORM typed schema; automated unit tests for XML parsers and backoff logic, and integration tests for SQLite upsert reconciliation before deployment.

## Project Structure

### Documentation (this feature)

```text
specs/001-bgg-collection-sync/
├── plan.md              # Implementation plan (this file)
├── research.md          # Architecture decisions, BGG polling, XML parser selection
├── data-model.md        # Drizzle schema, entity relationships, validation rules
├── quickstart.md        # End-to-end validation scenarios and test execution guide
├── contracts/           # Interface contracts
│   ├── bgg-api-contract.ts
│   └── sync-service-contract.ts
└── checklists/
    └── requirements.md  # Spec quality validation checklist
```

### Source Code (repository root)

```text
app/
├── (tabs)/
│   ├── collection.tsx                # Main collection screen (grid/list)
│   └── settings.tsx                  # BGG username and sync preferences
└── _layout.tsx                       # Root layout and database provider

src/
├── api/
│   ├── bgg-client.ts                 # HTTP client with rate-limiting & backoff
│   ├── bgg-xml-parser.ts             # fast-xml-parser mapping to domain types
│   └── types.ts                      # External API types & error definitions
├── db/
│   ├── schema.ts                     # Drizzle ORM schema (games, collection_items, etc.)
│   ├── client.ts                     # expo-sqlite database instance & migrations
│   └── repositories/
│       ├── game.repository.ts        # Upsert and query operations for games & dimensions
│       └── collection.repository.ts  # Ownership reconciliation & local note protection
├── services/
│   ├── collection-sync.service.ts    # Orchestrator for sync stages and progress events
│   ├── dimension-calculator.service.ts # Fallback dimension rules & unit conversions
│   └── image-cache.service.ts        # expo-file-system thumbnail caching
├── hooks/
│   ├── use-collection.ts             # React hook for offline queries & filtering
│   └── use-sync.ts                   # React hook for sync triggers & progress state
└── components/
    ├── sync-progress-modal.tsx       # Live status feedback during sync
    └── collection-list.tsx           # Virtualized list rendering for games

tests/
├── unit/
│   ├── bgg-xml-parser.test.ts        # Unit tests for XML parsing fixtures
│   ├── bgg-backoff.test.ts           # Unit tests for exponential backoff & jitter
│   └── dimension-calculator.test.ts  # Unit tests for box dimension fallbacks
└── integration/
    ├── collection-sync.test.ts       # End-to-end sync reconciliation test
    └── database-persistence.test.ts  # SQLite transaction & conflict resolution tests
```

**Structure Decision**: Selected standard Expo Router mobile application structure with a modular `src/` hierarchy strictly isolating API networking, SQLite database repositories, business services, and presentation hooks/components.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations detected. All architectural decisions strictly satisfy the Constitution.*
