# Feature Specification: AI-Assisted Rulebook Acquisition & Auto-Download Sync

**Feature Branch**: `013-ai-rulebook-download-sync`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "a funcionalidade do botao 📥 Verificar e Vincular Manuais de assets/rulebooks/ esta incorreta. O que esse botao deve fazer é, verificar se algum jogo do catalogo ainda nao tem o respectivo manual em pdf na pasta de assets/rulebooks. caso nao tenha, encontre com IA pra baixar o pdf e associe ao jogo"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One-Click Batch Rulebook Audit, AI Discovery & Download (Priority: P1)

As a board game collector using VirtualStand,
I want clicking the "📥 Verificar e Vincular Manuais" button in Settings to automatically inspect all games in my catalog, find which ones lack a physical PDF manual in `assets/rulebooks/`, search for authentic Portuguese rulebooks using AI/web resolvers, download the authentic PDF files directly into `assets/rulebooks/`, and link them to each game,
So that my entire collection gains instant offline access to genuine publisher rulebooks without me having to manually search, download, and attach 100+ PDFs individually.

**Why this priority**:
This is the core user-facing capability requested. The previous behavior only scanned existing files on disk and failed to acquire missing ones. Delivering this story transforms the button from a passive file checker into an active, intelligent downloader and associator.

**Independent Test**:
Can be tested by navigating to Settings, pressing the rulebook sync button on a collection containing games without local PDFs, and verifying that the system finds remote PT-BR PDF links, downloads the binary files into `assets/rulebooks/`, registers them as `READY` in SQLite, and updates `assets/data/virtualstand-catalog.json`.

**Acceptance Scenarios**:

1. **Given** a collection of games where some have local PDFs in `assets/rulebooks/` and others do not,
   **When** the user taps "📥 Verificar e Vincular Manuais" in the Settings screen,
   **Then** the system iterates through every game in the catalog, identifies missing rulebooks, and initiates the automated AI discovery and download process.

2. **Given** a game without a local rulebook in `assets/rulebooks/`,
   **When** the AI rulebook finder resolves an authentic Brazilian Portuguese PDF URL,
   **Then** the binary PDF is downloaded into `assets/rulebooks/${slug}-regras-ptbr.pdf`, verified against the `%PDF-` format header, registered in SQLite with `status: 'READY'`, and marked as newly synced.

3. **Given** a game that already has a verified manual in `assets/rulebooks/` registered as `READY`,
   **When** the sync runs,
   **Then** the game is skipped without re-downloading, incrementing the "already possessed" count.

4. **Given** the batch sync completes,
   **When** all games have been processed,
   **Then** a modal report displays the audit results (total games, already possessed, newly downloaded, and unavailable), and the physical versioned database `assets/data/virtualstand-catalog.json` is updated with the new rulebook references.

---

### User Story 2 - Real-Time Visual Progress & Granular Status Feedback (Priority: P2)

As a user initiating a batch manual download,
I want to see real-time progress indicators showing which game is currently being audited or downloaded,
So that I understand the system is actively working and know how many rulebooks have been retrieved so far.

**Why this priority**:
Downloading dozens of high-resolution PDF manuals over the network takes time. Clear visual progress prevents the user from assuming the app has frozen.

**Independent Test**:
Can be tested by observing the progress callback events during batch execution, ensuring the UI displays the current index, total count, and active game title being searched or downloaded.

**Acceptance Scenarios**:

1. **Given** the user triggers the batch rulebook sync,
   **When** the operation begins,
   **Then** the button or modal displays an active progress indicator with the current game title (e.g., "Buscando e baixando manual de Harmonies (12/126)...").

2. **Given** an individual game's manual is unavailable online,
   **When** the resolver fails to locate a verified PDF,
   **Then** the system logs the game as unavailable, increments the unavailable counter, and seamlessly moves to the next title without aborting the batch.

---

### User Story 3 - On-Demand Single Game Rulebook Resolution & Linking (Priority: P3)

As a collector viewing an individual game details screen,
I want an option to trigger the AI rulebook discovery and download for that specific game if it lacks a rulebook,
So that I can quickly acquire a newly added or single missing game's manual immediately from its detail view.

**Why this priority**:
Allows incremental acquisition when adding new individual games to the collection, without needing a full collection-wide batch re-run.

**Independent Test**:
Can be tested on the Game Detail Sheet by clicking "Baixar Manual com IA" for a game missing a rulebook, verifying the manual downloads, saves to `assets/rulebooks/`, and immediately unlocks the "Ler Manual" button.

**Acceptance Scenarios**:

1. **Given** a game on the Game Detail Sheet without a local rulebook,
   **When** the user taps "Baixar Manual (PT-BR)",
   **Then** the AI finder searches, downloads the PDF to `assets/rulebooks/`, associates it in SQLite, and enables the offline PDF reader.

---

### Edge Cases

- **No Authentic Portuguese PDF Available**: If an obscure or international-only indie title has no Brazilian Portuguese release or public PDF, the resolver must mark it as unavailable without creating empty or synthetic placeholder files.
- **Network Interruption or Timeout**: If the connection drops during a download, the partial file must not be committed to `assets/rulebooks/`, and the error must be recorded gracefully while continuing remaining games.
- **Non-PDF Payload Received**: If a resolved link returns an HTML error page (e.g., Cloudflare gate or 404 page disguised as 200), the magic byte validator must detect that it does not start with `%PDF-` and discard it.
- **Offline Execution**: If the user taps the button while disconnected from the internet, the system must immediately check existing files in `assets/rulebooks/` and notify the user that online searching requires internet access.
- **Duplicate Substrings in Titles**: The matching and slug generation must use exact slug matching and strict token boundaries to prevent substring collisions (e.g., "TEN" must never match "Exploding Kittens", "Cat and the Tower" must never match "Catan").

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST inspect the user's catalog and check for the presence of a corresponding physical PDF file in `assets/rulebooks/` for each game.
- **FR-002**: For any game lacking a physical PDF manual, the system MUST invoke an automated AI and registry resolver (`/api/find-rulebook`) to discover the authentic Portuguese rulebook download URL.
- **FR-003**: The resolver MUST query verified community/publisher registries (Panda Board Games, Bravo Jogos, Galápagos, Devir, Papergames, Scorpion Masqué, etc.) and search engine grounding with AI to locate genuine rulebook PDFs.
- **FR-004**: The system MUST download the raw binary PDF file directly into `assets/rulebooks/${slug}-regras-ptbr.pdf`.
- **FR-005**: The system MUST validate that every downloaded file starts with the binary PDF signature `%PDF-` before saving and registering it.
- **FR-006**: The system MUST insert a rulebook record into the local SQLite `rulebooks` table with `status = 'READY'`, `docType = 'BASE_RULES'`, `sourceKind = 'BUNDLED_ASSET'`, and the relative path `assets/rulebooks/${fileName}`.
- **FR-007**: The system MUST automatically update and persist the versioned physical catalog file `assets/data/virtualstand-catalog.json` with all newly downloaded rulebook associations.
- **FR-008**: The batch sync process MUST emit real-time progress callbacks containing `current`, `total`, `currentGameTitle`, and a descriptive message.
- **FR-009**: The Settings button "📥 Verificar e Vincular Manuais" MUST trigger this end-to-end audit, search, download, and registration process.
- **FR-010**: Synthetic plain-text LLM generation of manual contents MUST NOT be used for rulebook PDF generation; only authentic publisher documents are accepted.

---

### Key Entities *(include if feature involves data)*

- **Rulebook Asset**: Represents the physical binary PDF file stored in `assets/rulebooks/`, identified by its file name (`${slug}-regras-ptbr.pdf`), relative path, byte size, and MD5 checksum.
- **Game Rulebook Record**: SQLite entity in `rulebooks` table linking a `bggId` to a rulebook file with `status` (`READY`, `DOWNLOADING`, `ERROR`), `docType` (`BASE_RULES`), and metadata.
- **Physical Catalog Snapshot**: Versioned JSON artifact stored at `assets/data/virtualstand-catalog.json` containing the authoritative list of games, sleeve specifications, and rulebook references for git versioning and mobile hydration.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pressing "📥 Verificar e Vincular Manuais" resolves, downloads, and links all available authentic PT-BR PDFs for the user's collection without manual intervention.
- **SC-002**: 100% of downloaded rulebooks are authentic binary PDF files verified with the `%PDF-` signature.
- **SC-003**: The physical versioned catalog `assets/data/virtualstand-catalog.json` reflects all matched rulebooks and is ready to be committed to Git.
- **SC-004**: Zero false-positive substring matches (e.g., titles like "TEN" or "Cat and the Tower" are never misassociated with unrelated rulebooks).
- **SC-005**: The entire test suite (38+ test suites) passes cleanly, TypeScript compilation has 0 errors, and UI token audit maintains 100% compliance.

---

## Assumptions

- The user runs the application in local development / localhost mode (`isLocalhostOrDev()`) where local filesystem read/write APIs (`/api/find-rulebook`, `/api/scan-rulebooks`, `/api/save-catalog`) can write directly to the project's `assets/` folder.
- The mobile app on startup reads and hydrates from the bundled `assets/data/virtualstand-catalog.json` and bundled rulebooks in `assets/rulebooks/`.
- Internet access is available when the user triggers the download of missing rulebooks.
- Brazilian board game publishers and community repositories host authentic PDF files that can be queried publicly.
