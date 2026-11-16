# Feature Specification: Pre-populated Sleeves & Brazilian Portuguese Rulebooks

**Feature Branch**: `specs/009-prepopulated-sleeves-manuals`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "para a colecao de jogos, eu espero que as infos dos sleeves ja venham preenchidas, o app nao é pra cadastrar jogos novos, é mais pra consulta, Mesma coisa pros manuais, ja coloque as versoes em portugues do Brasil, os pdfs podem estar nesse mesmo repositorio em alguma pasta publica onde o app consiga abrir"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Sleeve Consultation for Collection Games (Priority: P1)

As a board game collector consulting my games on VirtualStand, I want to open any game in my collection and immediately see all card sleeve requirements (card set names, exact dimensions in millimeters, and total card counts) already filled in, so that I can instantly check which sleeves are needed without having to search or manually input specifications.

**Why this priority**: Consulting sleeve requirements is a primary reason collectors open the app. Requiring manual entry defeats the purpose of an automated collection companion.

**Independent Test**: Open any owned game with cards (e.g., Catan, Pandemic, Wingspan, Scythe, 7 Wonders, Terraforming Mars) in the game details sheet. Verify that the sleeve section immediately displays the pre-populated card sets, standard sleeve formats, millimeter dimensions, and card counts without any user typing.

**Acceptance Scenarios**:
1. **Given** an owned game with standard cards (e.g., Catan, Pandemic), **When** the user views the game details, **Then** the sleeve section displays the pre-filled card set name, sleeve format name, millimeter dimensions, and total card count.
2. **Given** an owned game with multiple card sizes (e.g., Scythe), **When** the user views the game details, **Then** all distinct card sets (mini, standard, tarot) appear pre-populated with their respective counts and dimensions.
3. **Given** an owned game with no cards (e.g., Azul, Carcassonne), **When** the user views the game details, **Then** the sleeve section displays a clear indicator that the game contains no cards ("Este jogo não utiliza cartas").

---

### User Story 2 - Bundled Brazilian Portuguese (PT-BR) Rulebooks (Priority: P1)

As a Brazilian board gamer, I want the rulebooks for my collection games to be already available in Brazilian Portuguese (PT-BR) directly within the app, loaded from the repository's public assets folder, so that I can read the official rules in my native language offline with a single tap.

**Why this priority**: Rulebook consultation at the game table is a core use case. Sourcing, uploading, and linking PDFs manually is tedious. Bundling pre-curated PT-BR rulebooks within the project makes the app ready to use out-of-the-box.

**Independent Test**: Select a game that has a bundled PT-BR rulebook in the repository. Verify that the rulebook appears listed in the game details as ready, and tapping it opens the PDF viewer displaying the Portuguese manual without network access.

**Acceptance Scenarios**:
1. **Given** a game in the user's collection that has a PT-BR PDF stored in the repository assets, **When** the app opens the game details, **Then** the Brazilian Portuguese manual is listed with a verified status and readable immediately.
2. **Given** an active or offline session, **When** the user taps to open the bundled PT-BR manual, **Then** the PDF viewer renders the document smoothly with page navigation, bookmarks, and note-taking enabled.
3. **Given** a game whose PT-BR manual is not yet added to the repository assets, **When** the user views the game details, **Then** the interface clearly indicates that the Portuguese manual is pending addition, without crashing or presenting broken links.

---

### User Story 3 - Streamlined Consultation Experience Without Registration Friction (Priority: P2)

As a user browsing my collection on the 3D aisle shelf or list views, I want the interface to focus strictly on consulting, searching, and viewing games, sleeves, and rulebooks, avoiding complex or redundant "add new game" creation flows.

**Why this priority**: The app's design objective is a digital showcase and reference tool for an existing physical collection, not an administrative database entry tool.

**Independent Test**: Navigate through the shelf, collection list, and game detail screens. Verify that consultation elements (3D shelf inspection, search, sleeve specs, rulebook reader, play stats) are prominently highlighted while unnecessary creation forms are absent.

**Acceptance Scenarios**:
1. **Given** the collection and shelf views, **When** navigating the app, **Then** the primary actions are search, filter, 3D shelf inspection, and details consultation.
2. **Given** the game details screen, **When** consulting sleeves and manuals, **Then** the content is presented in a clean, readable layout optimized for quick table-side reference.

---

### Edge Cases

- **Game with multiple editions/expansions**: How does the system handle sleeve requirements for base games vs expansions? The base game catalog entries provide the core set specifications, clearly labeled (e.g., "Baralho Principal", "Cartas de Objetivo").
- **Offline access to bundled PDFs**: Bundled repository PDFs are part of the application assets and must load offline without requesting external network resources.
- **Pre-populated vs User overrides**: If a user previously modified sleeve specifications or rulebook notes for a game, local user notes and ratings MUST be preserved and not overwritten.
- **Tile/token-only games**: Games with zero cards must explicitly show that no sleeves are needed rather than showing an empty error state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide comprehensive pre-populated card sleeve data for collection games, including card set names, format descriptions, dimensions in millimeters (width × height), and exact card counts.
- **FR-002**: For games with no cards (tile or wooden piece games), the system MUST display a clear confirmation that no sleeves are required.
- **FR-003**: The repository MUST include a dedicated public directory (e.g., `assets/rulebooks/`) containing Brazilian Portuguese (PT-BR) PDF rulebooks for collection games.
- **FR-004**: The system MUST automatically detect and link bundled PT-BR PDF rulebooks to their corresponding games by identifier or title upon startup or collection sync.
- **FR-005**: Bundled PT-BR rulebooks MUST open directly in the offline PDF reader with full support for page navigation, bookmarking, and notes.
- **FR-006**: The application UI MUST prioritize consultation and quick reference (3D aisle shelf, sleeve requirements, rulebooks, play logs) over manual game registration.
- **FR-007**: When new games are synced or displayed, sleeve requirements and bundled rulebooks MUST be seeded idempotently without duplicating records or destroying existing user annotations.

### Key Entities *(include if feature involves data)*

- **SleeveRequirement**: Pre-defined card set sleeve specifications associated with a game (game ID, card set title, sleeve format name, width in mm, height in mm, card quantity).
- **PreloadedRulebook**: Rulebook record linking a specific game to a local bundled PDF file (game ID, title, language "pt-BR", file path relative to assets, file size, status "READY").
- **Game**: The board game entity displaying metadata, physical dimensions for 3D rendering, sleeve specs, and rulebooks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of standard card-based games in the catalog display accurate sleeve specifications immediately upon opening game details, requiring 0 manual data entry steps from the user.
- **SC-002**: Bundled Brazilian Portuguese rulebooks open and display the first page in the PDF reader in under 1 second from tap.
- **SC-003**: All bundled rulebooks and sleeve specifications function completely offline with airplane mode enabled.
- **SC-004**: 0 broken asset links or failed PDF loads when accessing bundled PT-BR manuals.

## Assumptions

- Bundled Brazilian Portuguese PDFs are placed in the repository under an accessible assets folder (e.g., `assets/rulebooks/`) and committed to the project.
- Sleeve specifications are based on verified community datasets (Sleeve Size GeekList / BGG community data) for each supported game title.
- Existing user notes, bookmarks, and play logs remain strictly preserved during automatic seeding.
- The collection games are populated via BGG sync or predefined collection catalog, without requiring manual individual game registration forms.
