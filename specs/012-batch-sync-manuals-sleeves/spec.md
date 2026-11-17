# Feature Specification: Batch Sync for Rulebooks & AI-Powered Sleeves (012-batch-sync-manuals-sleeves)

**Feature Branch**: `012-batch-sync-manuals-sleeves`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "nao vejo todos os pdfs dos meus jogos. É possivel adicionar um botao na pagina de settings pra checar todos os meus jogos, ver os que ja tem manual ou nao e baixar? esse botao pode existir somente em localhost por enquanto (nao precisa exibir qdo a app tiver deployada). Use essa mesma estrategia para adicionar um botao que busque as infos dos sleeves. Se nao der pra bater na api direto do bgg ou em nenhuma outra publica, use AI do gemini configurada pra obter essa informacao, mantenha o uso de tokens sob controle, se possivel, de uma estimativa de quantos tokens seriam gerados pra completar essa acao"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bulk Audit & Sync of Collection Rulebook PDFs (Priority: P1)

As a board game collector using VirtualStand in local development,
I want to press a button in the Settings screen that audits all games in my collection and downloads missing Portuguese rulebooks,
So that I can consult all my game rules offline without having to open each game sheet individually.

**Why this priority**: Users currently have games in their collection that lack rulebook PDFs. Providing a one-click batch discovery and download tool resolves missing rulebooks across the entire library at once.

**Independent Test**: Can be tested by having multiple imported games in the local collection, opening Settings in localhost mode, triggering "Verificar e Baixar Manuais", and verifying that all games with available Brazilian Portuguese manuals are populated in the database with status READY.

**Acceptance Scenarios**:
1. **Given** a user has a collection with 10 games, where 3 have rulebooks and 7 do not, **When** the user taps "Verificar e Baixar Manuais" in the Settings developer section, **Then** the system inspects all 10 games, identifies the 7 games missing rulebooks, syncs available PT-BR manuals, and displays summary feedback (e.g., "7 manuais verificados, 7 novos manuais sincronizados").
2. **Given** a game already has a verified manual offline, **When** the batch sync runs, **Then** the existing manual is not duplicated or overwritten.
3. **Given** the application is running in a deployed production environment, **When** the Settings screen is displayed, **Then** the batch maintenance controls are hidden from view.

---

### User Story 2 - Bulk Sleeve Audit with AI Fallback for Unknown Titles (Priority: P1)

As a board game collector with cards to protect,
I want to press a button in Settings that checks all my games for sleeve requirements, automatically seeding from local community catalogs first and falling back to generative AI for missing titles,
So that my entire collection has sleeve sizes, formats, and quantities ready for shopping and protection.

**Why this priority**: Sleeve data is not always provided by public board game APIs. Combining community records with a fallback to the configured generative AI ensures maximum coverage for both mainstream and niche titles.

**Independent Test**: Can be tested with a mix of cataloged games (e.g., Catan, Scythe), tile games (Carcassonne), and uncataloged titles. Triggering "Verificar e Obter Sleeves" seeds catalog titles first, identifies titles still lacking sleeve data, queries the AI client in structured JSON format, and saves the retrieved specifications.

**Acceptance Scenarios**:
1. **Given** a game in the collection exists in the local community sleeve catalog, **When** the batch sleeve process runs, **Then** its sleeve specifications are seeded directly without making any external AI calls.
2. **Given** a game in the collection has zero cards (e.g., tile-only games), **When** the batch sleeve process runs, **Then** it is recognized as a zero-card game and no AI tokens are consumed.
3. **Given** a game is missing sleeve data and does not exist in the community catalog, **When** the batch sleeve process runs, **Then** the system requests the sleeve specifications from the configured AI service in structured format and saves the parsed format, dimensions, and card count.
4. **Given** a game already has sleeve specifications stored locally, **When** the batch process runs, **Then** it is skipped to prevent duplicate records or redundant API calls.

---

### User Story 3 - Transparent Token Budgeting & Pre-Execution Estimation (Priority: P2)

As a user with finite AI API quotas,
I want to see an upfront estimate of how many tokens will be consumed before triggering the AI sleeve discovery,
So that I can make an informed decision and avoid unexpected quota exhaustion or rate limits.

**Why this priority**: AI calls consume API tokens. Giving the user visibility into how many games need AI lookups and the estimated token consumption ensures trust, transparency, and cost control.

**Independent Test**: Can be tested by running an audit step that counts how many games actually need AI discovery and displays an estimate (e.g., "~300 tokens per game, 3 games pending ≈ ~900 tokens total") before executing the generation.

**Acceptance Scenarios**:
1. **Given** 5 games in the collection lack sleeve specifications, **When** the user views the sleeve sync section in Settings, **Then** the UI displays the count of pending games and estimated token usage (e.g., "5 jogos pendentes de busca • Estimativa: ~1.500 tokens").
2. **Given** no games in the collection lack sleeve data (all covered by catalog or previous scans), **When** the user views the sleeve sync section, **Then** the UI indicates that all games are up to date and 0 AI tokens are needed.
3. **Given** the AI API key is missing or invalid, **When** an AI discovery is attempted, **Then** the system halts gracefully, reporting that the AI key is not configured without crashing or corrupting local data.

---

### Edge Cases

- **Offline during batch execution**: If the device loses network connectivity during remote manual downloads or AI sleeve queries, the system records the failure for that specific title, preserves already-completed items, and presents a summary of succeeded vs failed titles.
- **AI returns unstructured or invalid JSON**: If the AI model returns text that cannot be parsed into sleeve dimensions and card counts, the item is marked as unverified and does not insert malformed data into the local database.
- **Large collection batching**: In collections with dozens or hundreds of games, operations must process sequentially or in bounded chunks (e.g., 5 items per tick) with progress updates to prevent freezing the UI thread.
- **Zero games in collection**: If the user has not imported any games from BGG yet, both buttons remain disabled or display an informative message instructing the user to sync their collection first.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST restrict visibility of the batch maintenance tools to localhost or local development environments (`__DEV__` or localhost hostname).
- **FR-002**: The system MUST provide a one-click action in Settings to audit all games in the user's collection for offline rulebook availability.
- **FR-003**: The rulebook sync action MUST download or register available Brazilian Portuguese (PT-BR) manuals for all games currently lacking an offline manual, skipping games that already have one.
- **FR-004**: The system MUST provide a one-click action in Settings to audit and populate sleeve requirements across all collection games.
- **FR-005**: The sleeve sync action MUST first attempt resolution via local community datasets and zero-card indicators before attempting any external AI requests.
- **FR-006**: For games lacking sleeve specifications after catalog check, the system MUST utilize the configured Gemini AI integration to query sleeve sizes (width, height in mm, format name) and card quantities using structured JSON mode.
- **FR-007**: The system MUST display an upfront token estimation indicating the number of games requiring AI generation and the approximate token volume before or during execution.
- **FR-008**: The system MUST provide real-time progress feedback (e.g., "Processando jogo 3 de 12...") and a completion summary detailing how many items were updated, skipped, or failed.
- **FR-009**: AI requests MUST enforce a strict token cap per game (`maxOutputTokens: 250`) and structured schema constraints to minimize token usage.

### Key Entities

- **RulebookSyncSummary**: Represents the result of a batch manual audit, including `totalGames`, `alreadySyncedCount`, `newlyDownloadedCount`, and `failedCount`.
- **SleeveSyncSummary**: Represents the result of a batch sleeve audit, including `totalGames`, `catalogMatchedCount`, `zeroCardCount`, `aiGeneratedCount`, `pendingCount`, `estimatedTokens`, and `failedCount`.
- **AiSleevePayload**: The structured JSON schema returned by Gemini AI containing `formatName`, `widthMm`, `heightMm`, `cardCount`, and `isZeroCard`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a collection with known catalog games missing manuals, 100% of available PT-BR manuals are registered locally after triggering the batch manual sync.
- **SC-002**: In a collection with uncataloged games, sleeve specifications are populated via Gemini AI in under 3 seconds per game with valid dimensions and card counts.
- **SC-003**: Average AI token consumption per queried game does not exceed 350 tokens (prompt + output combined).
- **SC-004**: The batch controls are 100% invisible when running in non-development / production environments.

## Assumptions

- The user has executed collection sync from BGG so that games exist in the local SQLite database.
- For AI-powered sleeve lookups, the user has configured `EXPO_PUBLIC_GEMINI_API_KEY` or `GEMINI_API_KEY` in their environment as provided by Feature 010.
- Games already having sleeve records or verified rulebooks take precedence and are never re-queried, conserving network quota and storage.
- Standard Euro / Board Game sizes (e.g., 63.5x88mm, 57x89mm, 44x68mm, etc.) are standard outputs expected from sleeve queries.
