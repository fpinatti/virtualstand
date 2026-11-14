# Feature Specification: Offline PDF Rulebook Viewer with Annotations and Play Logging

**Feature Branch**: `004-offline-rulebooks-playlog`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Visualizador offline de manuais de regras em PDF com anotações e registro de partidas"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Attach and Read Rulebooks Offline (Priority: P1)

A board game collector wants every game in their collection to carry its rulebook. From a game's detail view, the user attaches one or more PDF documents (base game rules, expansion rules, quick reference sheets) either by picking a file stored on the device or by providing a download link. Once attached, the document is stored on the device and can be opened at any time — including at a friend's house with no connectivity — in a full-screen reader supporting page navigation, pinch-to-zoom, and jumping to a specific page. The reader remembers the last page viewed for each document.

**Why this priority**: Core MVP. Looking up a rule mid-game is the most frequent need; having the manual reliably available offline, attached to the right game, delivers value on its own even without annotations or play logs.

**Independent Test**: Attach a PDF to a game from the device file picker, switch the device to airplane mode, close and reopen the app, open the game and read the rulebook; confirm pages render, zoom works, and the reader reopens on the last viewed page.

**Acceptance Scenarios**:

1. **Given** a game in the collection, **When** the user picks a PDF file from the device, **Then** the document is copied into the app's local storage, labeled (default label: file name), and listed under that game's "Manuais" section.
2. **Given** a game in the collection, **When** the user provides a valid download link to a PDF while online, **Then** the document is downloaded, stored locally, and listed under that game with progress feedback during download.
3. **Given** a stored rulebook and no network connection, **When** the user opens it, **Then** the document renders fully with page navigation, pinch-to-zoom, and a "go to page" control.
4. **Given** a user who closed a rulebook on page 14, **When** they reopen the same rulebook later, **Then** the reader resumes on page 14.
5. **Given** a game with multiple attached documents, **When** the user views the "Manuais" section, **Then** all documents are listed with label, page count, and file size, and each can be renamed or deleted.

---

### User Story 2 - Bookmarks and Page Notes on Rulebooks (Priority: P2)

While reading a rulebook, the user frequently needs to return to specific rules (setup, end-game scoring, edge-case clarifications). The user can bookmark any page with a short title and attach free-text notes to a page (e.g., "House rule: draw 2 instead of 1", "FAQ: the Ambush card can be played on your own turn"). A side panel lists all bookmarks and notes for the document; tapping one jumps directly to that page. Notes remain attached to the document independent of re-reading.

**Why this priority**: Turns a static manual into a personalized reference, drastically reducing rule lookup time during play. Depends on US1 but is independently valuable on top of it.

**Independent Test**: Open a stored rulebook, bookmark page 7 as "Pontuação final", add a note on page 3; close the reader, reopen it, open the annotations panel and tap each entry; confirm the reader jumps to pages 7 and 3 respectively and the note text is intact.

**Acceptance Scenarios**:

1. **Given** an open rulebook on any page, **When** the user taps "Adicionar marcador" and enters a title, **Then** a bookmark is saved for that page and a bookmark indicator appears while that page is displayed.
2. **Given** an open rulebook on any page, **When** the user adds a text note, **Then** the note is saved with its page number and creation timestamp.
3. **Given** a rulebook with bookmarks and notes, **When** the user opens the annotations panel, **Then** entries are listed ordered by page number, and tapping an entry navigates to that page.
4. **Given** an existing bookmark or note, **When** the user edits or deletes it, **Then** the change persists locally immediately.
5. **Given** a rulebook that is deleted, **When** deletion is confirmed, **Then** all its bookmarks and notes are removed as well after an explicit warning stating how many annotations will be lost.

---

### User Story 3 - Play Session Logging and Personal Ratings (Priority: P3)

After a game night, the user wants to record each play session: date, duration, participating players, each player's score, the winner(s), and free-form comments. Players are reusable across sessions (e.g., "Ana", "Bruno") so the user can pick them from a list instead of retyping. The user can also assign a personal rating (1–10) to the game independent of the BoardGameGeek rating. The game's detail view shows a play history summary: total plays, last played date, average duration, and win counts per player.

**Why this priority**: Enriches the collection with personal history and supports "what should we play tonight?" decisions, but is not needed to consult rules. Independent of US1/US2.

**Independent Test**: Log two sessions for a game with three players and scores, set a personal rating of 8; confirm the game detail shows "2 partidas", the correct last-played date, average duration, and per-player win counts — all with no network connection.

**Acceptance Scenarios**:

1. **Given** a game in the collection, **When** the user logs a play with date, duration, players, scores, and winner(s), **Then** the session is saved locally and appears at the top of the game's play history.
2. **Given** previously used player names, **When** the user starts a new session, **Then** existing players are offered for quick selection and new players can be created inline.
3. **Given** a cooperative game session, **When** the user marks the result as "Vitória do grupo" or "Derrota do grupo", **Then** the session is saved without requiring individual scores.
4. **Given** a game with logged sessions, **When** the user views its details, **Then** total play count, last played date, average duration, and wins per player are displayed and match the logged data.
5. **Given** any game, **When** the user sets a personal rating between 1 and 10, **Then** it is saved locally and shown alongside (never overwriting) the BoardGameGeek rating, and it survives subsequent collection synchronizations.
6. **Given** an existing session, **When** the user edits or deletes it, **Then** the play history summary recalculates accordingly.

---

### Edge Cases

- **Invalid or corrupted file**: Picking a non-PDF or a corrupted/password-protected PDF shows a clear error and does not create a rulebook entry.
- **Very large documents**: Rulebooks up to 100 MB / 300 pages must open without the app becoming unresponsive; files above 100 MB are rejected with an explanatory message.
- **Insufficient storage**: If the device lacks free space for an import or download, the operation aborts cleanly, partial files are removed, and the user is informed.
- **Interrupted download**: Losing connectivity mid-download marks the attempt as failed with a retry option; no half-downloaded document is ever listed as available.
- **Link is not a PDF**: A download link returning an HTML page or other content type is rejected.
- **Game removed from collection**: When a synchronization removes a game, its rulebooks, annotations, and play logs are preserved (local data ownership) and remain accessible until the user explicitly deletes them.
- **Duplicate attachment**: Attaching an identical file twice to the same game warns the user and offers to skip the duplicate.
- **Annotations past document end**: If a rulebook file is replaced by a version with fewer pages, annotations referencing missing pages are kept and flagged as "página indisponível" instead of silently discarded.
- **Ties**: Multiple winners can be selected for a single session.
- **Future dates**: Play sessions cannot be logged with a date in the future.
- **Deleting a player**: A player who appears in past sessions cannot be hard-deleted; they can be renamed or hidden from quick selection, preserving historical sessions.

## Requirements *(mandatory)*

### Functional Requirements

**Rulebook storage and reading**

- **FR-001**: Users MUST be able to attach one or more PDF documents to any game in their collection by selecting a file from device storage.
- **FR-002**: Users MUST be able to attach a PDF to a game by providing a download link while online; the system MUST show download progress and allow cancellation.
- **FR-003**: The system MUST store every attached document locally so it can be opened with no network connection.
- **FR-004**: Each document MUST have an editable label and a type (Regras base, Expansão, Referência rápida, FAQ, Outro), and display its page count and file size.
- **FR-005**: The reader MUST support page-by-page navigation, pinch-to-zoom, and direct jump to a page number.
- **FR-006**: The system MUST remember and restore the last viewed page per document.
- **FR-007**: Users MUST be able to rename and delete documents; deletion MUST require confirmation and remove the stored file.
- **FR-008**: The system MUST reject files that are not valid, readable PDFs or exceed 100 MB, with a user-friendly error message.
- **FR-009**: The game detail view and the 3D shelf box inspector MUST indicate whether a game has at least one rulebook available offline.

**Annotations**

- **FR-010**: Users MUST be able to create, edit, and delete titled bookmarks on any page of a document.
- **FR-011**: Users MUST be able to create, edit, and delete free-text notes associated with a specific page of a document.
- **FR-012**: The reader MUST provide an annotations panel listing all bookmarks and notes of the current document ordered by page, with tap-to-navigate.
- **FR-013**: The reader MUST visibly indicate when the current page has a bookmark or notes.

**Play logging and ratings**

- **FR-014**: Users MUST be able to log a play session for a game with: date (required, not in the future), duration in minutes (optional), participating players (at least one), individual scores (optional), winner(s) (zero or more), and comments (optional).
- **FR-015**: The system MUST support cooperative outcomes (group win / group loss) without individual scores.
- **FR-016**: The system MUST maintain a reusable player list; users MUST be able to create players inline, rename them, and hide them from quick selection.
- **FR-017**: Users MUST be able to edit and delete logged sessions.
- **FR-018**: The game detail view MUST display a play summary: total plays, last played date, average duration (of sessions with duration), and win count per player.
- **FR-019**: Users MUST be able to set, change, and clear a personal rating (integer 1–10) per game, displayed separately from the BoardGameGeek rating.

**Data ownership**

- **FR-020**: Rulebooks, annotations, play sessions, players, and personal ratings MUST be stored locally and MUST NOT be overwritten or deleted by collection synchronization.
- **FR-021**: All features in this specification, except downloading a document from a link, MUST work with no network connection.

### Key Entities

- **Rulebook Document**: A PDF attached to a game. Attributes: owning game, label, document type, original source (device file or link), page count, file size, last viewed page, date added.
- **Bookmark**: A titled marker on a specific page of a rulebook document.
- **Page Note**: Free text attached to a specific page of a rulebook document, with creation and update timestamps.
- **Player**: A reusable participant identity (name, hidden flag) referenced by play sessions.
- **Play Session**: One recorded play of a game. Attributes: game, date, duration, outcome type (competitive / cooperative win / cooperative loss), comments.
- **Session Participant**: Link between a play session and a player, with optional score and a winner flag.
- **Personal Rating**: The user's own 1–10 rating for a game, independent of the BoardGameGeek rating.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can attach a rulebook from device storage to a game in under 30 seconds.
- **SC-002**: A previously attached rulebook opens and displays its first (or last viewed) page within 2 seconds for documents up to 50 MB, with no network connection.
- **SC-003**: Jumping to a bookmarked page from the annotations panel takes no more than 2 taps and under 1 second.
- **SC-004**: A user can log a typical 4-player competitive session (players, scores, winner) in under 60 seconds using existing players.
- **SC-005**: 100% of rulebooks, annotations, play sessions, and personal ratings remain intact after a full collection re-synchronization and after an app restart.
- **SC-006**: Play summary statistics (total plays, last played, average duration, wins per player) match the logged sessions with 100% accuracy.
- **SC-007**: Reading and scrolling through a 300-page rulebook remains smooth, with no visible freezes longer than half a second.

## Assumptions

- Documents are obtained by the user (own scans, publisher downloads); the app does not search for, host, or redistribute rulebooks, avoiding copyright concerns.
- Annotations are limited to page bookmarks and text notes; freehand drawing, text highlighting, and in-document text search are out of scope for this version.
- Annotations are stored in the app, not written into the PDF file; exporting annotated PDFs is out of scope.
- Play logs are local only; syncing plays to or importing plays from BoardGameGeek is out of scope for this version (may be a future feature).
- Single-user device usage: the "players" list represents people the owner plays with, not app accounts.
- Personal rating uses whole numbers 1–10 to mirror the familiar BoardGameGeek scale.
- Depends on Feature 001 (games exist in the local collection) and integrates with the game detail sheet and Feature 002's 3D shelf box inspector for the rulebook availability indicator.

