# Quickstart Validation Guide: BGG Collection Sync

**Feature**: `001-bgg-collection-sync`  
**Date**: 2026-11-14  
**Status**: Ready for Validation  

---

## 1. Prerequisites

Before testing or running the synchronization workflow, ensure the following tools are available:
- Node.js $\ge 20$ and `npm` / `pnpm`
- Expo CLI (`npx expo`)
- A public BoardGameGeek username (e.g. standard test accounts or personal account)

Refer to:
- [Data Model](data-model.md) for entity schemas and relationships.
- [BGG API Contract](contracts/bgg-api-contract.ts) for endpoint structures.
- [Sync Service Contract](contracts/sync-service-contract.ts) for service contracts and event states.

---

## 2. Test Execution & Automated Verification

### 2.1 Unit Tests (XML Parser & Exponential Backoff Engine)
Validate that the BGG XML parsing and retry logic correctly handle HTTP 202 responses and XML structures:

```bash
# Run isolated unit tests for XML parsing and backoff calculations
npm test -- tests/unit/bgg-xml-parser.test.ts tests/unit/bgg-backoff.test.ts
```
**Expected Outcome**:
- All XML fixture tests pass, accurately extracting `bgg_id`, `collid`, ratings, and dimension nodes.
- Backoff engine tests confirm delay calculations, jitter bounds, and maximum retry threshold triggers.

### 2.2 Contract & Integration Tests (BGG API Mock & SQLite Persistence)
Validate SQLite upsert behavior and local enrichment preservation:

```bash
# Run integration tests against mocked BGG responses and SQLite in-memory instance
npm test -- tests/integration/collection-sync.test.ts
```
**Expected Outcome**:
- Reconciles 100 items into SQLite tables within 500 ms.
- Re-running the sync with changed ratings updates `bgg_rating` while preserving existing `local_notes` and custom tags.
- Missing dimensions automatically receive estimated fallback box records.

---

## 3. End-to-End Validation Scenarios

### Scenario A: Initial Collection Import with Queued Response (HTTP 202)
1. Launch app via `npx expo start`.
2. Navigate to the Collection screen.
3. Enter a valid BGG username and tap **Importar Coleção**.
4. **Validation Check**:
   - UI status immediately shows "Connecting to BoardGameGeek...".
   - If BGG responds with HTTP 202, UI displays "BGG está processando sua coleção, aguarde alguns instantes..." with retry countdown.
   - Upon completion, the screen renders all imported games with titles, covers, and ratings.
   - Enable Airplane Mode on the device or simulator: the collection remains 100% browsable, searchable, and responsive.

### Scenario B: Incremental Sync with Local Note Preservation
1. Select any game from the imported collection and enter a local personal note (e.g., "Board game night favorite - sleeved with Mayday Premium").
2. Trigger **Sincronizar Coleção** from the menu.
3. **Validation Check**:
   - Sync executes incrementally, showing progress bar.
   - Upon completion, reopen the game details: the custom personal note remains intact and unchanged.

### Scenario C: Offline Fallback & Network Interruption
1. Start an import or sync, then disconnect Wi-Fi / cellular midway.
2. **Validation Check**:
   - The sync session logs a graceful failure (`FAILED` in `sync_logs`).
   - The UI displays an informative toast ("Conexão perdida. A coleção local foi preservada.").
   - No half-written or corrupted records exist in `games` or `collection_items`.

