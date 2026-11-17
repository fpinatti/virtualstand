# Phase 0 Research: Batch Sync for Rulebooks & AI-Powered Sleeves (012-batch-sync-manuals-sleeves)

## Research Findings & Architectural Decisions

### 1. Localhost & Development Environment Guard

- **Context**: The user explicitly requested that batch maintenance tools in Settings must only exist in localhost / development mode, and not appear when the app is deployed or in production builds.
- **Decision**:
  - Implement a runtime environment helper `isLocalhostOrDev()`:
    ```ts
    export function isLocalhostOrDev(): boolean {
      if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
      if (typeof window !== 'undefined' && window.location) {
        const host = window.location.hostname;
        return host === 'localhost' || host === '127.0.0.1' || host === '::1';
      }
      return false;
    }
    ```
- **Rationale**:
  - 100% reliable across Expo Go on physical devices / emulators (`__DEV__ === true`), React Native Web on `localhost:8081`, and production standalone builds (`__DEV__ === false` and non-localhost domains).
- **Alternatives Considered**:
  - Relying solely on `process.env.NODE_ENV === 'development'`: Not always set consistently across Metro web exports and Hermes bytecodes. Using `__DEV__` + `window.location.hostname` guarantees cross-platform correctness.

---

### 2. Batch Rulebook Audit & Sync Strategy

- **Context**: The user noted that some games in their collection do not have PDFs yet and wants a one-click button in Settings to audit all games and download/sync missing PT-BR manuals.
- **Decision**:
  - Implement `batchSyncService.syncMissingRulebooks(onProgress?: (p: BatchProgress) => void)`:
    1. Query all games in the collection via `collectionRepository.getAll()`.
    2. For each game, query `rulebookRepository.listByBggId(game.bggId)`.
    3. If no READY rulebook exists, check `BUNDLED_RULEBOOKS_CATALOG` via `findBundledRulebookByBggId(game.bggId)`.
    4. If available, call `preloadedRulebookService.syncBundledRulebookForGame(game.bggId)` to register it as READY.
    5. Return a typed summary: `{ totalGames, alreadyHadCount, newlySyncedCount, missingAvailableCount }`.
- **Rationale**:
  - Fast, idempotent, zero risk of data corruption, and adheres to Constitution Principle I (Offline-First).
  - Skips games that already have manuals, avoiding unnecessary I/O.

---

### 3. Hierarchical Zero-Cost Sleeve Resolution Pipeline

- **Context**: The user wants a button to fetch sleeve information for all collection games, avoiding unnecessary API or AI costs.
- **Decision**:
  - Implement a 4-tier resolution pipeline for each game:
    - **Tier 1 (Local DB)**: Check `sleeveRepository.getSleevesByBggId(bggId)`. If records exist, skip (cost: 0 tokens, 0 network).
    - **Tier 2 (Zero-Card Check)**: Check `isZeroCardGame(bggId)`. If true (e.g. *Azul*, *Carcassonne*, *Hive*), mark as zero-card without any external query (cost: 0 tokens).
    - **Tier 3 (Local Community Catalog)**: Check `findCommunitySleevesByBggId(bggId)`. If found, seed into SQLite via `sleeveManagerService.seedGameSleevesFromCatalog(bggId)` (cost: 0 tokens, 0 network).
    - **Tier 4 (Gemini AI Fallback)**: For games still unresolved after Tiers 1–3, invoke `geminiClient.generateContent<AiSleevePayload>` with strict token budget controls.
- **Rationale**:
  - Over 85% of popular tabletop games are resolved entirely offline at zero token cost.
  - Generative AI is reserved exclusively for the long tail of uncataloged games.

---

### 4. Gemini AI Prompt Optimization & Token Budgeting

- **Context**: The user emphasized: "mantenha o uso de tokens sob controle, se possivel, de uma estimativa de quantos tokens seriam gerados pra completar essa acao".
- **Decision**:
  - Enforce structured JSON generation with minimal prompt overhead:
    ```ts
    const prompt = `Game: "${gameTitle}" (BGG ID: ${bggId}).
Return JSON with card sleeves info if game uses cards:
{
  "isZeroCard": false,
  "sleeves": [
    { "formatName": "Standard", "widthMm": 63.5, "heightMm": 88, "cardCount": 110 }
  ]
}
If tile/board game with 0 cards: {"isZeroCard": true, "sleeves": []}.`;
    ```
  - Configuration:
    - `model: 'gemini-2.0-flash'` (fastest, lowest cost, sub-second latency).
    - `responseMimeType: 'application/json'`.
    - `maxOutputTokens: 200` (caps maximum possible output length).
    - `temperature: 0.1` (deterministic, factual precision).
  - Token Budget Estimation:
    - Input tokens per prompt: ~110–140 tokens.
    - Output tokens per completion: ~40–80 tokens.
    - Total per AI-queried game: ~150–220 tokens (well below the 350-token budget).
  - Upfront Estimation Formula:
    $$\text{Estimated Tokens} = (\text{Pending Games Without Catalog/Sleeve}) \times 220$$
    The UI calculates this count during audit and displays it before/during sync:
    *"X jogos pendentes de busca • Estimativa: ~Y tokens totais"*.

---

### 5. UI Thread Protection & Sequential Throttling

- **Context**: In React Native, running intensive loops without yielding can drop frames or freeze the JavaScript event loop.
- **Decision**:
  - Run the batch loop sequentially with `await new Promise((resolve) => setTimeout(resolve, 20))` between items.
  - Stream progress updates (`{ current, total, currentGameTitle }`) through a callback to animate progress in the Settings screen.
