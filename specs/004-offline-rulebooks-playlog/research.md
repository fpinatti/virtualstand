# Research: Offline PDF Rulebook Viewer with Annotations and Play Logging

**Feature**: `004-offline-rulebooks-playlog` | **Date**: 2026-11-14

All Technical Context unknowns are resolved below. Format: Decision / Rationale / Alternatives considered.

---

## R1. PDF rendering engine

- **Decision**: `react-native-pdf` (with its required peer `react-native-blob-util`), rendering local `file://` URIs only.
- **Rationale**: Mandated by the Constitution's Technology Stack ("`react-native-pdf` for offline rulebook viewing"). Uses native renderers (PDFKit on iOS, PdfiumAndroid on Android), giving smooth paging and pinch-to-zoom for 300-page / 100 MB documents without loading the file into the JS heap. Exposes `page`, `onPageChanged`, `onLoadComplete(numberOfPages)`, `onError`, `enablePaging`, `minScale/maxScale` — everything FR-005/FR-006 need.
- **Alternatives considered**:
  - `react-native-webview` + pdf.js: works in Expo Go and on web, but parses PDFs in JS → slow and memory-heavy on large rulebooks (violates SC-002/SC-007).
  - `expo-print` / OS "open with" intent: leaves the app, cannot restore last page or overlay annotation indicators.

## R2. Expo build model (native module)

- **Decision**: Move from Expo Go to an **Expo development build** (`expo-dev-client`) and add a project `app.json` with config plugins `@config-plugins/react-native-pdf` and `@config-plugins/react-native-blob-util`.
- **Rationale**: `react-native-pdf` contains native code not bundled in Expo Go. Config plugins keep the managed workflow (no committed `ios/`/`android/` folders). The repo currently has no `app.json`; one must be created (name, slug, scheme, plugins).
- **Alternatives considered**: Bare workflow (prebuild committed) — unnecessary maintenance burden.

## R3. Web platform

- **Decision**: On web, the rulebook reader is **not offered**; the "Manuais" section shows "Leitura de manuais disponível no app iOS/Android". Annotations UI is hidden; play logging and personal ratings work normally on web.
- **Rationale**: `react-native-pdf` and `expo-file-system` persistent storage are native-only. A pdf.js fallback would duplicate the reader for a secondary platform. Documented in Complexity Tracking.
- **Alternatives considered**: pdf.js in an iframe on web — deferred to a future feature if web usage justifies it.

## R4. Importing from device storage

- **Decision**: `expo-document-picker` with `type: 'application/pdf'`, `copyToCacheDirectory: true`; then `FileSystem.moveAsync` from cache to `documentDirectory/rulebooks/{bggId}/{uuid}.pdf`.
- **Rationale**: Picker URIs (content:// on Android, security-scoped on iOS) are not durable; copying into app-owned storage guarantees offline availability (FR-003).
- **Alternatives considered**: Storing the picker URI directly — breaks when the user deletes/moves the original file.

## R5. Downloading from a link

- **Decision**: `FileSystem.createDownloadResumable(url, cacheTmpUri, {}, onProgress)` into `cacheDirectory/rulebook-downloads/`, then validate (R6) and move into permanent storage. Cancellation via `pauseAsync()` + deleting the temp file. Only `https://` URLs accepted. Network availability checked through the existing `src/services/network.service.ts`.
- **Rationale**: Native download avoids buffering 100 MB in JS; progress callback powers FR-002; temp location guarantees no half-downloaded file is ever listed (edge case "Interrupted download").
- **Alternatives considered**: `fetch` + blob — buffers the whole body in JS memory.

## R6. File validation (type, size, corruption, password)

- **Decision**: Two-stage validation:
  1. **Pre-persist (cheap, native)**: `FileSystem.getInfoAsync(uri, { size: true, md5: true })` → reject if `size > 100 MB` or `size === 0`; read first 5 bytes via `readAsStringAsync(uri, { encoding: Base64, position: 0, length: 5 })` and require the `%PDF-` magic header (catches HTML error pages from links, non-PDF picks).
  2. **First render verification**: the document is persisted with `status = 'PENDING_VERIFICATION'` and the reader opens immediately. `onLoadComplete(numberOfPages)` → `status = 'READY'`, `pageCount` stored. `onError` (corrupt / password-protected) → file + row deleted, user sees "Arquivo PDF inválido ou protegido por senha".
- **Rationale**: Page count and password protection can only be determined by the native PDF engine; doing it as part of the natural "open after import" flow avoids a hidden second renderer. Pending documents never appear as available in other screens.
- **Alternatives considered**: Parsing the PDF trailer in JS for `/Count` and `/Encrypt` — fragile (object streams, incremental updates) and requires reading the file into JS.

## R7. Duplicate detection

- **Decision**: Store the MD5 returned natively by `getInfoAsync({ md5: true })`; warn when the same `(bggId, md5)` already exists (edge case "Duplicate attachment").
- **Rationale**: Native hashing has no JS memory cost. MD5 is adequate for duplicate detection (not a security boundary).
- **Alternatives considered**: `expo-crypto` SHA-256 over base64 content — requires loading the file into JS.

## R8. Storage paths across app updates

- **Decision**: Persist **relative** paths (`rulebooks/{bggId}/{uuid}.pdf`) in SQLite and resolve against `FileSystem.documentDirectory` at runtime.
- **Rationale**: On iOS the app container UUID changes on reinstall/update; absolute paths stored in the DB would break (SC-005).
- **Alternatives considered**: Absolute URIs — known iOS breakage.

## R9. Last-page persistence

- **Decision**: Update `last_viewed_page` on `onPageChanged` debounced at 500 ms, plus a final flush on reader unmount / app background (`AppState`).
- **Rationale**: Avoids a DB write per swipe while guaranteeing FR-006 even if the app is killed shortly after.

## R10. Annotation model

- **Decision**: Two tables — `rulebook_bookmarks` (page, title) and `rulebook_notes` (page, body). Annotations are never written into the PDF. Page indicators computed from an in-memory `Set<page>` loaded once per open document.
- **Rationale**: Matches spec scope (bookmarks + text notes only). Keeping annotations relational preserves them independently of file replacement; annotations with `page > pageCount` are flagged "página indisponível" instead of deleted (edge case).
- **Alternatives considered**: Single polymorphic `annotations` table with `kind` — slightly fewer tables but weaker typing and nullable `title`/`body`.

## R11. Preserving data when games leave the collection

- **Decision**: New tables reference `games.bgg_id` **without `ON DELETE CASCADE`** (default `NO ACTION`). Collection sync only reconciles `collection_items` and never deletes `games` rows (verified in `collection-sync.service.ts` / repositories), so rulebooks, plays, and ratings survive removal from the BGG collection (FR-020).
- **Rationale**: Local data ownership (Constitution Principle I). Explicit user deletion paths remove child rows in a transaction.

## R12. Play log domain & statistics

- **Decision**: `players`, `play_sessions`, `play_participants` tables. `outcome` enum: `COMPETITIVE | COOP_WIN | COOP_LOSS`. Statistics computed by a **pure function** `computePlayStats(sessions)` in `src/services/play-stats.ts` (total plays, last played, average duration over sessions with duration, wins per player, ties counted as a win for each winner). Inputs validated with `zod` (already a dependency): date not in the future, ≥ 1 participant, scores finite, duration 1–1440 min.
- **Rationale**: Pure function = trivially unit-testable (SC-006, Constitution V). Volumes are small (hundreds of sessions per game), so on-the-fly computation is well under budget; no denormalized counters to keep in sync.
- **Alternatives considered**: Cached aggregate columns on `games` — risk of drift after edits/deletes.

## R13. Player deletion semantics

- **Decision**: Players have `is_hidden`; `deletePlayer` is only allowed when the player has zero participations, otherwise the service returns `PLAYER_IN_USE` and the UI offers "Ocultar".
- **Rationale**: Preserves historical sessions (edge case "Deleting a player").

## R14. Personal rating storage

- **Decision**: New table `personal_ratings (bgg_id PK, rating 1–10, updated_at)` rather than a column on `collection_items`.
- **Rationale**: A user may have multiple `collid`s for one game (editions), but the rating is per game; a separate table is also guaranteed untouched by `reconcileBggItems` (FR-019/FR-020).

## R15. New dependencies (verified and pinned for Expo SDK 52)

| Package | Approved Version | Purpose |
|---------|------------------|---------|
| `react-native-pdf` | `6.7.7` | Native PDF rendering |
| `react-native-blob-util` | `0.21.2` | Peer dependency of `react-native-pdf` (compatible with RN 0.76) |
| `@config-plugins/react-native-pdf` | `9.0.0` | Expo SDK 52 config plugin |
| `@config-plugins/react-native-blob-util` | `9.0.0` | Expo SDK 52 config plugin |
| `expo-dev-client` | `~5.0.20` | Development build runtime |
| `expo-document-picker` | `~13.0.3` | Device file selection |

All versions are pinned to Expo SDK 52-compatible releases (`npx expo install` / exact versions) and checked via the dependency scanner workflow.

