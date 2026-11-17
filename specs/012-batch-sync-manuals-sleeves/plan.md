# Implementation Plan: Batch Sync for Rulebooks & AI-Powered Sleeves (012-batch-sync-manuals-sleeves)

**Branch**: `012-batch-sync-manuals-sleeves` | **Date**: 2026-11-17 | **Spec**: [specs/012-batch-sync-manuals-sleeves/spec.md](specs/012-batch-sync-manuals-sleeves/spec.md)

**Input**: Feature specification from `specs/012-batch-sync-manuals-sleeves/spec.md`

## Summary

Implement a developer-oriented batch maintenance service in `src/services/batch-sync.service.ts` and UI in `app/(tabs)/settings.tsx`, guarded strictly to local development and localhost environments.
1. **Batch Manual Sync**: Scans all collection titles, identifies games missing rulebooks, and automatically syncs/registers available Brazilian Portuguese PDFs.
2. **Batch Sleeve Sync with AI Fallback**: Audits games lacking sleeve specifications, seeds catalog-matched games at zero cost, detects zero-card games, queries Gemini AI with structured JSON for uncataloged games, and provides upfront token budgeting and progress reporting.

## Technical Context

**Language/Version**: TypeScript 5.8+ (Strict Mode)
**Primary Dependencies**: React Native, Expo SDK 58, Expo SQLite, Drizzle ORM, Gemini AI Client (`src/services/ai/`)
**Storage**: SQLite (`rulebooks`, `game_sleeves`, `games`, `collection` tables)
**Testing**: Jest (`tests/unit/batch-sync.test.ts`)
**Target Platform**: Android (Expo Go / Standalone), iOS, React Native Web (Localhost)
**Project Type**: Mobile Tablet / Phone App
**Performance Goals**: Sub-second execution for local checks; ~1.5s per AI query; zero main-thread UI stutter
**Constraints**: Zero production footprint (controls hidden in production builds); strict token budget cap (max 250 output tokens per AI query); 100% offline-first for non-AI tasks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Offline-First & Local Data Ownership)**: ✅ PASS. All discovered rulebooks and sleeves are saved directly to local SQLite. If network/AI drops, local data remains intact.
- **Principle III (Resilient External Integrations)**: ✅ PASS. Gemini AI calls use structured JSON, timeout aborts, rate-limit mappings, and strict per-query token budgets.
- **Principle IV (Modular Layered Architecture)**: ✅ PASS. Batch business logic resides in `batch-sync.service.ts`. UI components in `settings.tsx` only consume typed service methods.
- **Principle V (Type Safety & Test Discipline)**: ✅ PASS. Zero untyped `any`. Strict interfaces defined in `batch-sync-contracts.ts`. Comprehensive unit tests.

## Project Structure

### Documentation (this feature)

```text
specs/012-batch-sync-manuals-sleeves/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Architectural decisions & token estimation analysis
├── data-model.md        # Entities & reporting schemas
├── quickstart.md        # Validation scenarios
├── contracts/           # TypeScript contract interfaces
│   └── batch-sync-contracts.ts
└── checklists/
    └── requirements.md  # 16/16 requirements checklist
```

### Source Code

```text
src/
├── services/
│   ├── batch-sync.service.ts       # NEW: Core batch audit & sync orchestration
│   ├── ai/
│   │   ├── gemini-client.ts        # EXISTING: Generative AI client
│   │   └── gemini-types.ts         # EXISTING: AI types & contracts
│   ├── preloaded-rulebook.service.ts
│   └── sleeve-manager.service.ts
app/
└── (tabs)/
    └── settings.tsx                # UPDATE: Add Dev Maintenance section (localhost-guarded)
tests/
└── unit/
    └── batch-sync.test.ts          # NEW: Unit tests for batch operations & token budgeting
```

## Implementation Phases

### Phase 1: Service Architecture & Contracts
- Define contract interfaces in `src/services/batch-sync.service.ts` based on `contracts/batch-sync-contracts.ts`.
- Implement `isLocalhostOrDev()` environment detector.
- Implement `syncMissingRulebooks()` iterating collection games and calling `preloadedRulebookService.syncBundledRulebookForGame()`.

### Phase 2: Hierarchical Sleeve Seeding & AI Fallback
- Implement `auditCollectionSleeves()` to calculate pending games and token budget estimation before running.
- Implement `syncMissingSleeves()`:
  - Check local DB -> skip if already present.
  - Check zero-card -> skip if true.
  - Check `findCommunitySleevesByBggId` -> seed if match.
  - Fallback to `geminiClient.generateContent<AiSleeveOutputPayload>` with structured JSON schema.
  - Save results via `sleeveManagerService.saveGameSleeve`.

### Phase 3: Settings UI Integration
- In `app/(tabs)/settings.tsx`, conditionally render the Developer Batch Maintenance card when `isLocalhostOrDev()` is true.
- Add progress bars, status badges, token estimation previews, and action buttons.

### Phase 4: Verification & Quality Gates
- Unit tests in `tests/unit/batch-sync.test.ts`.
- `npm test` across all 32 test suites.
- `npm run typecheck` and `npm run ui:audit`.
