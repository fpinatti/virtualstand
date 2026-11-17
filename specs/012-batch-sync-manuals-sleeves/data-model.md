# Data Model: Batch Sync for Rulebooks & AI-Powered Sleeves (012-batch-sync-manuals-sleeves)

## Models & Type Definitions

Defined in `specs/012-batch-sync-manuals-sleeves/contracts/batch-sync-contracts.ts` and `src/services/batch-sync.service.ts`.

### 1. `BatchSyncProgress`
Tracks real-time progress of batch execution for UI reporting.

| Field | Type | Description |
|---|---|---|
| `stage` | `'rulebooks' \| 'sleeves'` | Current active batch operation |
| `current` | `number` | Current item index (1-based) |
| `total` | `number` | Total number of items in collection |
| `currentGameTitle` | `string` | Title of the game currently being processed |
| `message` | `string` | User-friendly progress description |

---

### 2. `RulebookBatchReport`
Result summary after running the batch rulebook audit & sync.

| Field | Type | Description |
|---|---|---|
| `totalGames` | `number` | Total games evaluated in the collection |
| `alreadyHadCount` | `number` | Games that already had a verified rulebook |
| `newlySyncedCount` | `number` | Games for which a PT-BR manual was downloaded/registered |
| `unavailableCount` | `number` | Games for which no manual is currently available |
| `durationMs` | `number` | Total execution duration in milliseconds |

---

### 3. `SleeveBatchReport`
Result summary after running the batch sleeve audit & discovery.

| Field | Type | Description |
|---|---|---|
| `totalGames` | `number` | Total games evaluated in the collection |
| `alreadyHadCount` | `number` | Games that already had sleeve specifications in SQLite |
| `catalogMatchedCount` | `number` | Games resolved via local community catalog (0 AI tokens) |
| `zeroCardCount` | `number` | Games identified as tile/piece games with 0 cards (0 AI tokens) |
| `aiDiscoveredCount` | `number` | Games resolved via Gemini AI structured JSON generation |
| `aiFailedCount` | `number` | Games where AI query was attempted but failed or was offline |
| `tokensUsedEstimate` | `number` | Approximate total tokens consumed during the batch |
| `durationMs` | `number` | Total execution duration in milliseconds |

---

### 4. `AiSleeveOutputPayload`
Structured JSON contract returned by Gemini AI when querying sleeves.

| Field | Type | Required | Description |
|---|---|---|---|
| `isZeroCard` | `boolean` | Yes | True if game has no cards (tiles, meeples, board only) |
| `sleeves` | `Array<AiSleeveItem>` | Yes | Array of sleeve card sets |
| `sleeves[].formatName` | `string` | Yes | Sleeve format name (e.g. "Standard", "Mini European") |
| `sleeves[].widthMm` | `number` | Yes | Width of sleeve in mm |
| `sleeves[].heightMm` | `number` | Yes | Height of sleeve in mm |
| `sleeves[].cardCount` | `number` | Yes | Total cards of this format in the game |

---

### 5. Database Persistence

This feature integrates directly into existing SQLite tables without schema migration:
- **`rulebooks`**: New manuals registered with `sourceKind: 'BUNDLED_ASSET'`, `status: 'READY'`.
- **`game_sleeves`**: AI-discovered and catalog-seeded sleeves stored via `sleeveManagerService.saveGameSleeve()`.
- **`collection` / `games`**: Read-only source of titles and `bggId`s.
