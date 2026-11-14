# Research & Architecture Decisions: BGG Collection Sync

**Feature**: `001-bgg-collection-sync`  
**Date**: 2026-11-14  
**Status**: Completed  

---

## 1. BoardGameGeek XMLAPI2 Integration & Polling Strategy

### Context
BoardGameGeek's `https://boardgamegeek.com/xmlapi2/` is an XML-only API. When requesting a user collection (`/collection?username={username}&stats=1`), the BGG server frequently responds with `HTTP 202 Accepted` ("Your request for this collection has been accepted and will be processed. Please try again later for access."). If an application immediately fails or hammers the endpoint, it gets blocked by rate limits or presents an error.

### Decision
- **Client Polling Engine**: Implement a dedicated `BggClient` with exponential backoff and jitter for `HTTP 202` responses:
  - Initial delay: 2,000 ms.
  - Multiplier: 1.5x with +/- 20% random jitter.
  - Max retry attempts: 8 (giving a cumulative wait window of ~50 seconds).
  - Terminal condition: `HTTP 200` with valid `<items>` payload or timeout error after 60s.
- **Rate-Limiting**: Enforce a minimum interval of 1,500 ms between distinct outgoing requests to BGG, with an in-memory queue to prevent parallel bursting.

### Rationale
- BGG backend builds collection XML asynchronously for large or infrequently requested collections. Polling with exponential backoff prevents server rejection while providing predictable wait times.
- Adding jitter prevents thundering herd spikes when multiple network calls or reconnects occur.

### Alternatives Considered
- *Direct fetch without retry*: Rejected. Fails on ~40% of first-time collection queries where BGG returns HTTP 202.
- *Fixed-interval polling (e.g. every 1s)*: Rejected. Violates BGG rate limiting guidelines and risks HTTP 429 throttling.

---

## 2. BGG XML Parsing in React Native / Expo

### Context
React Native's JavaScriptCore / Hermes environment does not provide the browser `DOMParser` or `window.document`. An XML parser is required to convert BGG's XML responses into typed JavaScript objects.

### Decision
- Use `fast-xml-parser` (v4.x) with strict attribute parsing:
  - `ignoreAttributes: false`
  - `attributeNamePrefix: "@_"`
  - `parseAttributeValue: true`
  - `trimValues: true`

### Rationale
- `fast-xml-parser` is 100% pure JavaScript/TypeScript, has zero native dependencies, runs seamlessly on Hermes, and is significantly faster than `xml2js` or DOM-based shims.
- Provides predictable object structures for attributes like `<item objectid="13" collid="12345">` and text nodes like `<name>Catan</name>`.

### Alternatives Considered
- *xmldom / DOMParser polyfills*: Heavier memory footprint and slower parsing for large XML payloads (1,000+ items).
- *Regex extraction*: Extremely fragile; fails on escaped characters, CDATA blocks, and unexpected tag ordering in BGG XML.

---

## 3. Physical Box Dimension Retrieval (`/thing?versions=1`)

### Context
BGG collection endpoints provide titles, ratings, and artwork, but physical box dimensions (`width`, `length`/`height`, `depth`, `weight`) reside in physical version records accessible via `/thing?id={ids}&versions=1`.

### Decision
- **Batching Strategy**: Query `/thing?id={batch_ids}&versions=1` in batches of 20 game IDs at a time.
- **Version Selection**:
  1. If a game has version records matching the user's language/locale or primary release, extract `<width>`, `<length>`, and `<depth>`.
  2. If version records exist with dimensions in inches, convert to centimeters: $cm = inches \times 2.54$.
  3. If no physical version record has valid dimensions, assign category-based fallback dimensions:
     - Standard Box (Euro/Catan-style): $29.7 \times 29.7 \times 7.1\text{ cm}$
     - Card Game / Small Box: $12.0 \times 18.0 \times 4.0\text{ cm}$
     - Big Box / Heavy Strategy: $31.5 \times 31.5 \times 10.0\text{ cm}$
  4. Flag record as `isEstimated: true` so the UI displays an estimated badge and enables manual calibration.

### Rationale
- Batching 20 IDs per request reduces network roundtrips by 95% (e.g. 100 games resolved in 5 requests rather than 100).
- Standard fallbacks ensure that 100% of games are immediately renderable in the 3D virtual shelf even when BGG version records are incomplete.

### Alternatives Considered
- *Single-item requests for every game*: Severely throttled by BGG rate limiting; 100 games would take over 2 minutes.
- *Omitting dimension fetch until opening 3D shelf*: Leads to pop-in and inconsistent layout shifts on the shelf; pre-fetching during sync provides instant 3D rendering.

---

## 4. Local Persistence & Synchronization Reconciliation with Drizzle ORM

### Context
Per Constitution Principle I, the local SQLite database is the single source of truth. Remote BGG sync must reconcile into local tables without overwriting local custom notes, attached PDFs, or sleeve records.

### Decision
- **Schema Separation**:
  - `games`: Canonical game metadata keyed by `bgg_id` (title, year, min/max players, playtime, cover URL, thumbnail URL).
  - `box_dimensions`: Physical measurements keyed by `game_id` (width, height, depth, weight, is_estimated).
  - `collection_items`: User collection state keyed by `coll_id` (BGG collection ID) and `bgg_id`, storing `rating`, `user_comment`, `status_own`, `status_wishlist`, `created_at`, `updated_at`, along with local-only fields (`local_notes`, `custom_tags`).
  - `sync_logs`: Audit trail tracking sync timestamp, duration, items added, items updated, status.
- **Reconciliation / Diff Logic**:
  - Upsert `games` and `box_dimensions` using `INSERT ... ON CONFLICT (bgg_id) DO UPDATE`.
  - Reconcile `collection_items` using `coll_id`: Update BGG-provided fields (`rating`, `bgg_comment`, `status`) while explicitly preserving `local_notes`, `custom_tags`, and rulebook references.
  - Wrap batch updates in a single SQLite transaction (`db.transaction()`) to guarantee atomicity and speed.

### Rationale
- SQLite transaction batching allows writing 500+ records in <100ms.
- Separating canonical game metadata from user collection records cleanly models expansion games, multi-copy ownership, and local enrichment preservation.

### Alternatives Considered
- *Wiping and replacing local tables on each sync*: Unacceptable data loss; destroys local notes and custom tags.
- *WatermelonDB*: Requires heavy Babel decorators and native setup; Drizzle ORM provides superior TypeScript DX, zero-config Expo SQLite integration, and pure SQL migration support.

---

## 5. Offline Image Asset Caching Strategy

### Context
BGG provides remote image URLs (`image` and `thumbnail`). To guarantee full offline functionality (Principle I), images must be accessible without network connectivity.

### Decision
- Use `expo-file-system` to download and cache thumbnails to `${FileSystem.documentDirectory}/covers/{bgg_id}.jpg`.
- Lazy cache on first render or background pre-fetch during initial import:
  - High-priority: Thumbnail images (~20-50KB each) are downloaded in parallel (bounded concurrency of 4) during sync.
  - Full-resolution box covers: Cached when the user inspects a game detail or selects it for the 3D shelf.
- Database stores both remote URL (`thumbnail_url`) and local file URI (`local_thumbnail_uri`).

### Rationale
- Local file caching guarantees immediate offline display with zero network requests.
- Bounded concurrency prevents socket exhaustion on mobile devices.

### Alternatives Considered
- *In-memory Base64 blob storage in SQLite*: Bloats SQLite file size drastically and hurts database query performance.
- *Relying solely on default HTTP cache headers*: Unreliable on mobile OS, which may clear temporary caches unpredictably when storage is low.

