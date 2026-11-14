# Implementation Plan: Offline PDF Rulebook Viewer with Annotations and Play Logging

**Branch**: `004-offline-rulebooks-playlog` | **Date**: 2026-11-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-offline-rulebooks-playlog/spec.md`

## Summary

Add three local-first capabilities to each game: (1) attach PDF rulebooks from device storage or an `https` link, stored in app-owned storage and read offline with a native PDF reader that remembers the last page; (2) page bookmarks and text notes with an annotations panel and in-reader indicators; (3) play session logging with reusable players, competitive/cooperative outcomes, computed play statistics, and a personal 1–10 rating independent of BGG. Technical approach: `react-native-pdf` in an Expo development build, `expo-document-picker` + `expo-file-system` for import/download with two-stage validation, seven new SQLite tables via Drizzle, and pure, unit-tested validation/statistics functions (see [research.md](research.md)).

## Technical Context

**Language/Version**: TypeScript 5.x (strict) / React Native 0.76 / Expo SDK 52

**Primary Dependencies**: Existing — `expo-router`, `expo-sqlite`, `drizzle-orm`, `expo-file-system`, `zod`. New — `react-native-pdf`, `react-native-blob-util`, `@config-plugins/react-native-pdf`, `@config-plugins/react-native-blob-util`, `expo-dev-client`, `expo-document-picker` (R15; dependency scan required before install)

**Storage**: SQLite tables `rulebooks`, `rulebook_bookmarks`, `rulebook_notes`, `players`, `play_sessions`, `play_participants`, `personal_ratings`; PDF files in `documentDirectory/rulebooks/{bggId}/{uuid}.pdf` referenced by relative path (R8)

**Testing**: Jest + ts-jest; `expo-file-system` / `expo-sqlite` mocked via `tests/mocks/` (already configured in `jest.config.js`); new mock for `expo-document-picker`

**Target Platform**: iOS and Android via development build (full feature); Web (play log + ratings only — R3)

**Project Type**: Mobile application (Expo Router, single project)

**Performance Goals**: Open a ≤ 50 MB rulebook in < 2 s (SC-002); no UI freeze > 0.5 s on 300-page documents (SC-007); annotation jump < 1 s (SC-003); play stats computation < 10 ms for 500 sessions

**Constraints**: 100% offline except link download (FR-021); max file 100 MB; no PDF bytes loaded into the JS heap (native hashing/validation only); last-page writes debounced (R9)

**Scale/Scope**: ~5 documents per game, hundreds of annotations, hundreds of sessions per game, tens of players

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle / Gate | Status | Evidence |
|------------------|--------|----------|
| **I. Offline-First & Local Data Ownership** | PASS | PDFs copied into app storage; all metadata/annotations/plays/ratings in SQLite; sync never touches new tables and new FKs to `games` have no cascade (R11). Only link download needs network, with explicit offline error. |
| **II. Procedural 3D Shelf** | PASS | No 3D asset changes; box inspector only gains a rulebook availability badge (FR-009) reading from SQLite outside the render loop. |
| **III. Resilient External Integrations** | PASS | Downloads use native resumable download to a temp dir, cancellable, validated before persisting; failures never leave partial entries. No new BGG calls. |
| **IV. Layered Architecture** | PASS | `src/db/repositories/*` (persistence) → `src/services/*` (validation, file ops, stats) → `src/hooks/*` → `src/components/*` / `app/*`. Pure functions (`play-stats`, validators) have no I/O. |
| **V. Type Safety & Test Discipline** | PASS | Contracts in `contracts/`; zod schemas for inputs; TDD for stats, play validation, file validation, rulebook/annotation services, rating persistence. No `any`. |
| Tech Stack | PASS | Uses Constitution-mandated `expo-file-system` + `react-native-pdf`. Adds dev build requirement (R2). |
| Gate 2 — Lint | NOTE | ESLint is not yet configured in the repo; typecheck is enforced. Tracked as pre-existing gap, not introduced by this feature. |
| Gate 5 — Offline Verification | PASS | Quickstart Scenarios A, B (offline download) cover fallback behavior. |

**Post-design re-check (after Phase 1)**: PASS — data model keeps all user data local with no cascading deletes from `games`; contracts isolate native modules behind services so business logic remains testable under Jest. One justified deviation listed under Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/004-offline-rulebooks-playlog/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R15
├── data-model.md        # Phase 1: 7 tables, state machine, derived stats
├── quickstart.md        # Phase 1: validation scenarios A–G
├── contracts/
│   ├── rulebook-contract.ts   # IRulebookService, IAnnotationService
│   └── playlog-contract.ts    # IPlayLogService, IPlayerService, IPersonalRatingService
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
app.json                                   # NEW: Expo config + react-native-pdf/blob-util plugins

app/
├── _layout.tsx                            # + rulebook cleanupPending() on startup; register reader route
└── rulebook/
    └── [id].tsx                           # Full-screen PDF reader route (native only)

src/
├── db/
│   ├── schema.ts                          # + 7 tables, relations, types
│   ├── client.ts                          # + CREATE TABLE/INDEX IF NOT EXISTS
│   └── repositories/
│       ├── rulebook.repository.ts         # rulebooks + bookmarks + notes
│       ├── play-log.repository.ts         # sessions + participants + players
│       └── personal-rating.repository.ts
├── services/
│   ├── rulebook-types.ts                  # re-export contracts
│   ├── playlog-types.ts                   # re-export contracts
│   ├── rulebook-file.service.ts           # pick/download/validate/move/delete files (native APIs)
│   ├── rulebook-validation.ts             # pure: size, magic header, url, label rules
│   ├── rulebook.service.ts                # IRulebookService
│   ├── annotation.service.ts              # IAnnotationService
│   ├── play-validation.ts                 # pure zod schemas + validatePlaySession()
│   ├── play-stats.ts                      # pure computePlayStats()
│   ├── play-log.service.ts                # IPlayLogService + IPlayerService
│   └── personal-rating.service.ts         # IPersonalRatingService
├── hooks/
│   ├── use-rulebooks.ts
│   ├── use-annotations.ts
│   └── use-play-log.ts
└── components/
    ├── rulebooks/
    │   ├── rulebook-list.tsx              # "Manuais" section in game detail (web fallback message)
    │   ├── rulebook-import-sheet.tsx      # device / link import with progress & duplicate prompt
    │   ├── pdf-reader.tsx                 # react-native-pdf wrapper (page, zoom, go-to-page, indicators)
    │   └── annotations-panel.tsx          # bookmarks + notes list, add/edit/delete
    ├── playlog/
    │   ├── play-session-form.tsx          # date, duration, outcome, participants, scores, winners
    │   ├── player-picker.tsx              # quick select + inline create
    │   ├── play-history.tsx               # session list + edit/delete
    │   └── play-stats-card.tsx            # totals, last played, avg duration, wins per player
    ├── personal-rating-input.tsx          # 1–10 selector shown next to BGG rating
    ├── game-detail-sheet.tsx              # + Manuais, Partidas, Nota pessoal sections
    └── shelf-3d/                          # box inspector: + rulebook badge

tests/
├── mocks/
│   └── expo-document-picker.js            # NEW
└── unit/
    ├── play-stats.test.ts
    ├── play-validation.test.ts
    ├── rulebook-validation.test.ts
    ├── rulebook-service.test.ts
    ├── annotation-service.test.ts
    └── personal-rating.test.ts
```

**Structure Decision**: Continue the existing single-project Expo Router layout. Native-only concerns (`react-native-pdf`, document picker, file system) are confined to `rulebook-file.service.ts` and `pdf-reader.tsx` so services and pure logic stay testable under Jest with module mocks. The reader is a dedicated stack route (`app/rulebook/[id].tsx`) for full-screen reading rather than a modal inside the detail sheet.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Rulebook reader unavailable on Web (Principle I "read manuals offline" on all targets) | `react-native-pdf` and persistent `expo-file-system` storage are native-only | pdf.js/WebView reader would duplicate the reader, is slow on large PDFs, and web has no durable offline file store in the current architecture; deferred until web usage warrants it |
| Switching from Expo Go to development builds | `react-native-pdf` requires native code (Constitution-mandated library) | Expo Go cannot load it; a JS-only PDF renderer fails SC-002/SC-007 |
