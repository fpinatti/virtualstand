# Phase 0 Research: Pre-populated Sleeves & Brazilian Portuguese Rulebooks

## Research Findings & Architectural Decisions

### 1. Pre-populated Sleeves Catalog & Automated Seeding

- **Context**: The user requires that all card sleeve information (dimensions in mm, card set names, sleeve format names, and quantities) be pre-filled automatically for collection games, eliminating manual data entry.
- **Decision**:
  - Expand the built-in community catalog (`src/data/community-sleeves-catalog.ts`) to comprehensively cover popular tabletop titles and games present in user collections (including Catan, Pandemic, 7 Wonders, Wingspan, Ticket to Ride, Terraforming Mars, Exploding Kittens, Coup, Scythe, Azul, Azul: Queen's Garden, Azul: Summer Pavilion, Flatiron, Art Robbery, Dungeon Drop, Star Realms, Gloom, etc.).
  - Explicitly model zero-card games (such as tile/token games like *Azul* and *Carcassonne*) with empty card lists (`cards: []`) so the UI displays a clean, unambiguous confirmation ("Este jogo não utiliza cartas") instead of an empty missing state.
  - Automate seeding in `SleeveManagerService`: upon collection sync or application startup, run idempotent batch seeding so that every owned game without existing sleeve records is instantly populated in SQLite.
- **Rationale**: Collectors use VirtualStand to organize and protect physical copies. Immediate availability of verified sleeve specs fulfills the core product value without friction.
- **Alternatives Considered**:
  - *Calling a remote third-party API at runtime*: Rejected because BGG does not provide official sleeve dimensions in XMLAPI2, and external scrapers are brittle and fail when offline (violating Constitution Principle I).
  - *Manual user input*: Rejected per explicit user requirement.

---

### 2. Brazilian Portuguese (PT-BR) Rulebooks Bundled in Repository

- **Context**: The user wants game manuals in Brazilian Portuguese already included in the repository in a public/accessible folder, so the app can open and display them immediately.
- **Decision**:
  - Create a public asset directory in the repository: `assets/rulebooks/` containing Brazilian Portuguese PDF rulebooks.
  - Define a typed manifest `BUNDLED_RULEBOOKS_CATALOG` in `src/data/bundled-rulebooks-catalog.ts` mapping `bggId` to the bundled PDF relative asset path, title in PT-BR, file size, and MD5 hash.
  - Implement `PreloadedRulebookService` to automatically seed bundled manuals into the SQLite `rulebooks` table with:
    - `bggId`: Game identifier
    - `label`: "Manual em Português (PT-BR)"
    - `docType`: "BASE_RULES"
    - `sourceKind`: "BUNDLED_ASSET"
    - `status`: "READY"
    - `relativePath`: Path relative to the app's rulebook directory
  - On app launch, the service verifies the files and registers them in the database so that opening any supported game displays the PT-BR manual ready for immediate reading in `PdfReader`.
  - Provide valid sample PT-BR rulebook PDFs with correct `%PDF-1.4` headers and readable structure for initial collection games in `assets/rulebooks/`.
- **Rationale**: Bundled assets ensure 100% offline-first reliability (Constitution Principle I) and instant loading on both mobile (Expo Go / standalone) and web without external download delays or broken URL dependencies.
- **Alternatives Considered**:
  - *Downloading PDFs from external URLs on first open*: Rejected because publisher URLs change, expire, or return 404/403, and require internet access.
  - *Embedding PDFs as base64 in database*: Rejected because base64 inflates database size and increases memory pressure during SQLite reads. Storing PDFs as files in `assets/rulebooks/` is standard and maintainable.

---

### 3. Consultation-Centric Experience (Read-Heavy / Zero Registration Friction)

- **Context**: The user clarified: "o app nao é pra cadastrar jogos novos, é mais pra consulta".
- **Decision**:
  - Focus the UI on browsing and consultation: 3D aisle shelf navigation, fast search and filters, instant sleeve spec consultation, one-tap rulebook reading, and play logging.
  - Avoid intrusive "Add Game" modal flows or blank registration forms. Collection data is either synced from BGG or pre-loaded, and enrichment (sleeves, manuals) is pre-configured out-of-the-box.
- **Rationale**: Streamlines the user journey directly to the desired actions (checking sleeves before buying, consulting rules during game night).
