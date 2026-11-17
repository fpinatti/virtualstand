# Implementation Plan: AI-Assisted Rulebook Acquisition & Auto-Download Sync (013-ai-rulebook-download-sync)

**Branch**: `013-ai-rulebook-download-sync` | **Date**: 2026-11-17 | **Spec**: [specs/013-ai-rulebook-download-sync/spec.md](spec.md)

**Input**: Feature specification from `specs/013-ai-rulebook-download-sync/spec.md`

## Summary

Refactor the rulebook synchronization pipeline to actively discover, download, and associate authentic Brazilian Portuguese (PT-BR) PDF rulebooks:
1. **Rulebook Finder API**: An Expo Router API route (`app/api/find-rulebook+api.ts`) that resolves authentic PDF download URLs using curated community/publisher registries and search engine grounding with AI, streams verified binary `%PDF-` files into `assets/rulebooks/`, and returns metadata.
2. **Batch Sync Integration**: Integrate `/api/find-rulebook` directly into `batchSyncService.syncMissingRulebooks()` so that pressing "📥 Verificar e Vincular Manuais" in `app/(tabs)/settings.tsx` actively downloads missing PDFs for uncataloged games rather than passively checking existing disk files.
3. **Physical Versioned Catalog Persistence**: Synchronize the resulting SQLite records with `assets/data/virtualstand-catalog.json` so the physical versioned database can be committed to Git and immediately hydrated on mobile.

## Technical Context

**Language/Version**: TypeScript 5.8+ (Strict Mode)
**Primary Dependencies**: React Native, Expo SDK 58, Expo Router, Expo SQLite, Drizzle ORM, Node.js filesystem APIs (`fs`, `path`)
**Storage**: Host filesystem (`assets/rulebooks/*.pdf`), SQLite (`rulebooks`, `games` tables), JSON (`assets/data/virtualstand-catalog.json`)
**Testing**: Jest (`tests/unit/find-rulebook-api.test.ts`, `tests/unit/batch-sync.test.ts`)
**Target Platform**: Android (Expo Go / Standalone), iOS, React Native Web (Localhost)
**Project Type**: Mobile Tablet / Phone App + Dev API Routes
**Performance Goals**: Sub-second execution for local registry lookups; binary stream download with 15s timeout cap; zero main-thread UI stutter during batch runs
**Constraints**: 100% authentic PDF binaries verified with `%PDF-` signature (zero synthetic LLM text summaries); strict token boundaries preventing substring false positives; offline-capable for reading once downloaded

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Offline-First & Local Data Ownership)**: ✅ PASS. All downloaded rulebooks are stored locally in `assets/rulebooks/` and registered in SQLite. Once acquired, viewing is 100% offline.
- **Principle III (Resilient External Integrations)**: ✅ PASS. Remote PDF downloads validate HTTP status, verify binary magic bytes, handle timeouts, and fail gracefully without crashing batch sync.
- **Principle IV (Modular Layered Architecture)**: ✅ PASS. Backend resolution logic isolated in `app/api/find-rulebook+api.ts`, orchestration in `batch-sync.service.ts`, and presentation in `settings.tsx`.
- **Principle V (Type Safety & Test Discipline)**: ✅ PASS. Strict TypeScript contracts in `find-rulebook-contract.ts`. Comprehensive unit tests for API and batch service.

## Project Structure

### Documentation (this feature)

```text
specs/013-ai-rulebook-download-sync/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Architectural decisions & discovery strategies
├── data-model.md        # Entities & reporting schemas
├── quickstart.md        # Verification scenarios & CLI commands
├── contracts/           # TypeScript contract interfaces
│   └── find-rulebook-contract.ts
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code

```text
app/
├── (tabs)/
│   └── settings.tsx                  # UPDATE: Settings screen triggering syncMissingRulebooks
└── api/
    ├── find-rulebook+api.ts          # NEW: Route to search, download, and save authentic PDFs
    ├── save-rulebook+api.ts          # EXISTING: Saves base64/binary PDF to assets/rulebooks/
    ├── scan-rulebooks+api.ts          # EXISTING: Returns list of local PDFs in assets/rulebooks/
    └── save-catalog+api.ts           # EXISTING: Persists catalog snapshot to assets/data/

src/
├── services/
│   ├── batch-sync.service.ts         # UPDATE: Calls find-rulebook for missing games in collection
│   ├── catalog.service.ts            # EXISTING: Physical catalog export/seed service
│   ├── preloaded-rulebook.service.ts # EXISTING: Bundled manifest rulebook registration
│   └── rulebook.service.ts           # EXISTING: Rulebook query and attachment service

assets/
├── data/
│   └── virtualstand-catalog.json     # Physical versioned collection catalog
└── rulebooks/                        # Authentic binary .pdf rulebooks

tests/
└── unit/
    ├── find-rulebook-api.test.ts     # NEW: Tests for find-rulebook API route
    └── batch-sync.test.ts            # UPDATE: Tests for auto-downloading missing rulebooks
```

## Implementation Phases

### Phase 1: Route Contract & Validation
- Implement `app/api/find-rulebook+api.ts` with curated registry, `%PDF-` binary signature check, and physical file persistence.
- Add unit tests in `tests/unit/find-rulebook-api.test.ts`.

### Phase 2: Batch Sync Integration
- Update `batch-sync.service.ts` so `syncMissingRulebooks` calls `/api/find-rulebook` for any game without a local PDF.
- Register newly acquired manuals into SQLite with status `READY`.
- Automatically save the catalog snapshot to `assets/data/virtualstand-catalog.json`.

### Phase 3: Collection Download & Verification
- Execute downloader across collection titles.
- Verify 100% test pass rate (`npm test`), 0 TypeScript errors (`npm run typecheck`), and design token compliance (`npm run ui:audit`).
