# Quickstart & Validation: Offline PDF Rulebook Viewer with Annotations and Play Logging

**Feature**: `004-offline-rulebooks-playlog`

References: [data-model.md](data-model.md) · [contracts/rulebook-contract.ts](contracts/rulebook-contract.ts) · [contracts/playlog-contract.ts](contracts/playlog-contract.ts) · [research.md](research.md)

## Prerequisites

- Features 001–003 implemented; at least one game in the local collection (e.g. Catan, `bggId 13`).
- New dependencies installed via `npx expo install` after passing the dependency scan (research R15).
- `app.json` present with the `react-native-pdf` / `react-native-blob-util` config plugins.
- A **development build** (Expo Go cannot load `react-native-pdf`):

```bash
npx expo prebuild --clean   # local only, not committed
npx expo run:android        # or: npx expo run:ios
```

- Sample files on the device: `catan-rules.pdf` (valid, ~20 pages), `fake.pdf` (a renamed `.txt`), `locked.pdf` (password-protected).

## Automated checks

```bash
npm run typecheck
npm test
```

Expected: 0 TypeScript errors; new suites pass — `play-stats`, `play-validation`, `rulebook-validation`, `rulebook-service`, `annotation-service`, `personal-rating` — and all prior suites remain green.

## Scenario A — Import from device and read offline (US1)

1. Open Catan → "Manuais" → "Adicionar do aparelho" → pick `catan-rules.pdf`.
2. Reader opens automatically; page count appears in the list afterwards; status is ready.
3. Navigate to page 14, close the reader.
4. Enable airplane mode, force-close and relaunch the app.
5. Reopen the rulebook.

**Expected**: Renders offline, pinch-to-zoom and "Ir para página" work, reader resumes on page 14. Game detail and 3D shelf inspector show the "manual offline" indicator.

## Scenario B — Validation and failure paths (US1 edge cases)

| Action | Expected |
|--------|----------|
| Pick `fake.pdf` | "O arquivo não é um PDF válido"; nothing listed |
| Pick `locked.pdf` | Reader fails to load → "Arquivo PDF inválido ou protegido por senha"; entry removed |
| Pick `catan-rules.pdf` again | Duplicate warning with "Pular" / "Importar mesmo assim" |
| Import from link while offline | "Sem conexão" (`OFFLINE`) |
| Link to an HTML page | `NOT_A_PDF`, temp file deleted |
| Disable network mid-download | Failure with "Tentar novamente"; no partial entry listed |
| Kill app while reader verifies a new import | On next launch the pending entry and file are gone |

## Scenario C — Download from link (US1)

1. Online, "Adicionar por link" → paste an `https://…pdf` URL.
2. Observe progress; optionally cancel once and retry.

**Expected**: Progress updates; cancel leaves nothing behind; completed download behaves like Scenario A.

## Scenario D — Bookmarks and notes (US2)

1. In the Catan rulebook, on page 7 add bookmark "Pontuação final"; on page 3 add a note.
2. Close and reopen; open the annotations panel.
3. Tap each entry; edit the note; delete the bookmark.
4. Delete the rulebook.

**Expected**: Entries ordered by page; taps jump to pages 3/7; page indicators visible; edits persist; deletion warns "2 anotações serão removidas" (count matches) and removes them.

## Scenario E — Play logging and stats (US3)

1. Log session 1: today, 90 min, Competitive, Ana 10 (winner), Bruno 8, Carla 7 (create players inline).
2. Log session 2: yesterday, 60 min, Ana 9, Bruno 9 (both winners — tie), Carla 5.
3. Try a future date → blocked (`FUTURE_DATE`).
4. Set personal rating 8.
5. Run a full BGG sync (Settings).

**Expected**: Detail shows "2 partidas", last played = today, average 75 min, wins Ana 2 / Bruno 1 / Carla 0; rating 8 shown next to (not replacing) BGG rating and still 8 after sync. Attempting to delete "Bruno" offers "Ocultar" instead (`PLAYER_IN_USE`).

## Scenario F — Cooperative game (US3)

Log a session for a co-op game (e.g. Pandemic) as "Vitória do grupo" with 2 players.

**Expected**: Saved without scores; stats show co-op record 1–0; supplying scores on a co-op outcome is rejected (`COOP_WITH_SCORES`).

## Scenario G — Web platform

Run `npm run web`, open a game.

**Expected**: "Manuais" shows "Leitura de manuais disponível no app iOS/Android"; play log and personal rating work.

## Security Verification Plan

- **Path Traversal & File Storage**: Stored files use randomized tokens (`rulebooks/{bggId}/{token}.pdf`), never user-supplied filenames; `toAbsoluteUri` rejects `..` and enforces the `rulebooks/` prefix.
- **File Content & Size Validation**: Pre-persist validation enforces `1 B .. 100 MB` and the `%PDF-` magic header (`JVBERi` in base64) before moving out of cache.
- **HTTPS-only Downloads**: `validateDownloadUrl` rejects `http:`, `file:`, `javascript:`, and malformed URLs.
- **Parameterized Queries**: All SQLite access uses Drizzle ORM parameterized builders; zero string concatenation.
- **Framework-Native Escaping**: All UI components render via React Native `<Text>` nodes with no raw HTML injection.

## Validation Log (2026-11-14)

- **Automated Verification (`npm run typecheck && npm test`)**: PASS — 0 TypeScript errors; 24 test suites passed (77 tests total), covering Scenarios A–F logic (`rulebook-validation`, `rulebook-service`, `annotation-service`, `play-stats`, `play-validation`, `personal-rating`, `player-service`, `feature004-schema`, `feature004-sync-preservation`).
- **Web Fallback (Scenario G)**: Verified via `Platform.OS === 'web'` guard in `RulebookList` and `app/rulebook/[id].tsx`.


