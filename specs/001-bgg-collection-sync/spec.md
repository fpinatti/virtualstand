# Feature Specification: BGG Collection Import and Resilient Synchronization

**Feature Branch**: `001-bgg-collection-sync`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Importação e sincronização resiliente da coleção BGG com persistência offline em SQLite"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initial Collection Import from BoardGameGeek (Priority: P1)

A board game collector provides their public BoardGameGeek (BGG) username to populate their digital catalog. The system initiates retrieval, gracefully handles upstream queueing or processing delays with clear feedback, persists all game metadata locally, and renders the populated collection. Once imported, the user can browse, filter, and inspect their full catalog without requiring an internet connection.

**Why this priority**: Foundational MVP slice. Without importing and storing the collection locally, no other feature (virtual shelf display, sleeve tracking, rulebook viewing) can function.

**Independent Test**: The user inputs a valid BGG username, taps "Import Collection", observes real-time progress, and successfully views their complete game library with covers, player counts, and personal ratings while the device is in airplane mode.

**Acceptance Scenarios**:

1. **Given** a user with a valid BoardGameGeek username, **When** they request a collection import, **Then** the system initiates retrieval, displays an active progress indicator, saves all games to local storage, and renders the collection list.
2. **Given** the remote service queues the request during high load, **When** the system waits for data readiness, **Then** the user is presented with an informative status message ("Processing collection on BoardGameGeek, please wait...") rather than an error or frozen interface.
3. **Given** an imported collection, **When** the user loses network connectivity or enters offline mode, **Then** the entire collection, cached cover art, and game details remain fully browsable and searchable without degradation.

---

### User Story 2 - Incremental Sync with Local Enrichment Preservation (Priority: P2)

A collector who regularly updates their BGG collection (adding new titles, updating personal ratings, or changing wishlist status) triggers an incremental synchronization. The system identifies additions, modifications, and deletions from BGG and updates the local catalog accordingly, while strictly preserving user-created local enrichments (such as attached rulebook PDFs, sleeve inventory counts, and custom play notes).

**Why this priority**: Essential for day-to-day usability. Users continuously acquire new games and update scores on BGG; they must not lose local annotations or have to wipe their catalog to see updates.

**Independent Test**: The user alters a game rating on BGG, adds a custom play note locally in the app, runs a synchronization, and confirms that the rating updated while the custom play note remained intact.

**Acceptance Scenarios**:

1. **Given** an existing local collection and updated remote BGG records, **When** the user triggers a sync, **Then** new games are added, modified remote fields are refreshed, and existing local notes/attachments are preserved.
2. **Given** an in-progress sync that is interrupted by network drop, **When** connection fails, **Then** the local database remains consistent without partial corruption, and a clear retry notice is displayed.
3. **Given** games removed from the user's remote BGG collection, **When** sync runs, **Then** the system updates their ownership status locally without deleting associated local history or files.

---

### User Story 3 - Automatic Physical Box Dimension Extraction (Priority: P3)

During game import or synchronization, the system automatically retrieves physical box dimensions (width, height, depth) and edition data. If dimensions are found, they are stored to enable proportional 3D shelf rendering. If dimensional data is absent from the remote catalog, the system assigns a standard estimated box size and allows the user to specify or adjust the dimensions manually.

**Why this priority**: Required for authentic 3D virtual shelf rendering in real proportions, but secondary to basic collection management and offline access.

**Independent Test**: Import a game with documented physical editions; verify the game's specification screen displays box measurements in centimeters/inches and allows editing if a different edition is owned.

**Acceptance Scenarios**:

1. **Given** an imported game with physical version records, **When** version details are processed, **Then** real box dimensions (width, height, depth) are stored and displayed in metric and imperial units.
2. **Given** a game whose remote record lacks box measurements, **When** imported, **Then** standard fallback dimensions are assigned with an "Estimated dimensions" badge, and the user can manually enter custom dimensions.

---

### Edge Cases

- **Non-Existent or Private Account**: When an invalid username is submitted, display a helpful message: "BoardGameGeek user not found. Please verify the username."
- **Empty Collection**: When an account has 0 games, show an onboarding view explaining how to add games on BGG or try another username.
- **Service Rate Limiting / Temporary Outage**: When the remote service signals request limits or server errors, the system must pause requests, present a countdown or retry button, and avoid crashing or repeating rapid queries.
- **Large Collections (1,000+ Games)**: Bulk data persistence must execute in chunked background operations to prevent freezing the user interface.
- **Special Characters in Titles / Comments**: Game titles with accents, umlauts, or non-Latin scripts must be stored and displayed correctly in UTF-8 without corruption.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to input a BoardGameGeek username to initiate a collection import.
- **FR-002**: System MUST handle asynchronous upstream queue responses (e.g. processing delays) using automated polling with progressive retry intervals up to a maximum safety threshold.
- **FR-003**: System MUST persist all imported game records—including unique service identifiers, collection entry identifiers, title, publication year, player counts, play duration, cover image references, user ratings, and user comments—into local persistent storage.
- **FR-004**: System MUST operate in an offline-first manner, allowing full browsing, searching, sorting, and viewing of game details directly from local storage with no internet connection required.
- **FR-005**: System MUST support incremental synchronization that reconciles remote changes with local records without overwriting local custom notes, attached files, or sleeve tracking data.
- **FR-006**: System MUST fetch and record physical edition metadata, specifically box dimensions (width, height, depth) and weight, for each imported title.
- **FR-007**: System MUST provide sensible fallback box dimensions when remote dimensional records are absent, and allow users to manually edit dimensions.
- **FR-008**: System MUST cache game thumbnail and box cover images locally to ensure uninterrupted visual display during offline usage.
- **FR-009**: System MUST present real-time progress indications during sync (items processed, current status phase, and timestamp of last successful sync).
- **FR-010**: System MUST enforce request rate limiting and throttle outbound network calls to prevent IP blocking by external services.

### Key Entities

- **Game**: Represents a board game title with canonical identity (service ID), title, publication year, minimum/maximum player counts, average playtime, and image assets.
- **CollectionItem**: Represents a user's ownership record for a game, tracking acquisition status (owned, wishlist, played), personal score/rating, user comments, and local custom annotations.
- **BoxDimension**: Represents the physical packaging measurements (width, height, depth, weight, measurement unit) and verification status (verified from edition or estimated fallback).
- **SyncLog**: Represents the execution audit of an import or sync operation, recording timestamps, total items scanned, items inserted, items updated, completion status, and error diagnostic messages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete an initial import of a 100-game collection in under 45 seconds under standard network conditions.
- **SC-002**: 100% of imported games, ratings, notes, and cached artwork remain accessible, readable, and searchable with zero network connectivity.
- **SC-003**: 0% data duplication or local data loss across repeated or interrupted sync sessions.
- **SC-004**: The user interface provides responsive visual status within 2 seconds of import initiation, even when the remote service is queuing requests.
- **SC-005**: At least 85% of standard modern board games in a collection automatically receive physical box dimensions without manual user entry.
- **SC-006**: Collection filtering and search queries on a 500-game local library return results in under 100 milliseconds.

## Assumptions

- The target BoardGameGeek account's collection is publicly accessible.
- The mobile device has sufficient local storage capacity for the SQLite database and cached cover images (~50MB to 150MB for average collections).
- The synchronization flow is one-way from BoardGameGeek into the local repository, with local overrides and annotations preserved during reconciliation.
- Standard box dimension defaults (e.g., standard 30x30x7 cm "Euro box" size) will be applied when remote edition metadata lacks measurements.

