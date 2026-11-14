# Feature Specification: Board Game Card Sleeve Inventory and Sizing Catalog

**Feature Branch**: `003-card-sleeve-manager`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Gestão de estoque e catálogo de dimensões de sleeves para jogos de tabuleiro"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Card Sleeve Specification and Multi-Size Tracking per Game (Priority: P1)

A board game collector inspecting a title in their collection wants to know exactly what protective card sleeves are needed. The system displays all card sizes used by the game, the required card count for each size (e.g. 60 Standard American cards of 56x87mm plus 24 Mini Euro cards of 44x68mm), and common commercial sleeve format designations. The user can mark individual card sets as "Already Sleeved" or "Needs Sleeving", and can manually add or calibrate card dimensions and quantities for expansions or custom promos.

**Why this priority**: Fundamental MVP requirement. Protecting board game cards from wear, spills, and marked edges is a top priority for collectors, and knowing exact dimensions and card counts per game is essential before purchasing or sleeving.

**Independent Test**: Open any game from the collection; navigate to the Sleeves section; verify that all required card sizes and quantities are listed, and toggle a card size between "Sleeved" and "Pending" with persistent local updates.

**Acceptance Scenarios**:

1. **Given** a game in the user's collection, **When** the user views the Sleeves section, **Then** all card sets for that game are displayed with dimensions (width x height in mm), card quantities, and standard format names (e.g. Standard Card Game, Mini European).
2. **Given** a game with multiple card sizes, **When** displayed, **Then** each size is listed independently with its own quantity and sleeving status.
3. **Given** a game with custom cards or expansions, **When** the user adds a custom sleeve entry, **Then** the new sleeve specification is saved and associated with that game locally.
4. **Given** a card set, **When** the user toggles the "Sleeved" checkbox, **Then** its status updates locally and reflects in overall game completion.

---

### User Story 2 - Sleeve Inventory Stock and Automated Shopping List Calculator (Priority: P2)

A collector who maintains a stockpile of unused sleeve packs wants to track what they have on hand (e.g., 2 unopened packs of Mayday Standard 63.5x88mm containing 100 sleeves each) and calculate what needs to be purchased to sleeve their un-sleeved games. The system cross-references all pending card counts across the collection against the user's available sleeve stock, generating an aggregated shopping list detailing the exact number of packs required by sleeve size and standard pack quantity.

**Why this priority**: Solves the core user pain point of over-purchasing or buying wrong sleeve sizes, saving money and streamlining shopping before board game events.

**Independent Test**: Register 1 owned pack of 100 Standard sleeves in the inventory; assign two un-sleeved games requiring 60 and 80 Standard sleeves respectively; verify the shopping list indicates a net deficit of 40 sleeves (recommending 1 additional pack of 100).

**Acceptance Scenarios**:

1. **Given** a user with spare sleeve packs, **When** they add items to their Sleeve Inventory, **Then** the system records sleeve format, brand/label, sleeve dimensions (mm), and remaining loose/pack sleeve quantities.
2. **Given** multiple un-sleeved games across the collection, **When** the user opens the "Shopping List" view, **Then** total sleeves needed are grouped by format/size, available inventory is deducted, and the net packs to purchase are displayed.
3. **Given** a user buys and applies sleeves to a game, **When** marked as sleeved, **Then** the corresponding quantity is automatically deducted from available stock.

---

### User Story 3 - Community Sleeve Catalog Pre-Population and Auto-Matching (Priority: P3)

When new games are imported from BoardGameGeek, the system automatically checks a pre-populated community sleeve database (derived from trusted sources such as the BGG Sleeve Size GeekList 164572) and links the appropriate sleeve requirements to the game without requiring manual research or data entry by the user.

**Why this priority**: Eliminates tedious manual measurement and research for hundreds of games, providing instant value upon collection import.

**Independent Test**: Import a popular title (e.g. Catan, 7 Wonders, or Wingspan); immediately open its sleeve view and confirm that correct card quantities and dimensions are pre-filled automatically.

**Acceptance Scenarios**:

1. **Given** an imported game matching a known community sleeve catalog entry, **When** imported or viewed, **Then** its sleeve requirements are automatically pre-populated with verified dimensions and counts.
2. **Given** a game not present in the community catalog, **When** viewed, **Then** a friendly prompt allows the user to easily input card dimensions and share/save them locally.

---

### Edge Cases

- **Non-Standard Card Sizes**: Oversized cards (e.g., Dixit 80x120mm) and square cards (e.g., 70x70mm) must be fully supported with metric dimensions.
- **Pack Size Discrepancies**: Different brands package sleeves in quantities of 50, 55, 100, or 110. The shopping calculator must allow configurable pack sizes (defaulting to 100 or 50).
- **Games with 0 Cards**: Games with no cards (e.g. Hive, Santorini, abstract tile-placers) must clearly indicate "No cards required" rather than an error or blank view.
- **Offline Reliability**: The entire sleeve catalog, stock tracking, and shopping calculator must function 100% offline using local storage.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST record and display card sleeve requirements per game, including card width (mm), card height (mm), card count, format name, and whether the set is sleeved.
- **FR-002**: System MUST support multiple distinct card sleeve specifications for a single board game.
- **FR-003**: System MUST provide a dedicated Sleeve Inventory tracking user-owned spare sleeve stock by format, brand, dimensions, and quantity.
- **FR-004**: System MUST automatically generate an aggregated Shopping List summarizing total sleeves needed, available stock, and net packs to buy across all un-sleeved games.
- **FR-005**: System MUST allow users to manually create, edit, or remove sleeve requirements for any game in their collection.
- **FR-006**: System MUST pre-populate sleeve requirements using a built-in community catalog mapping board game IDs to standard sleeve sizes.
- **FR-007**: System MUST provide a one-tap action to mark an entire game as fully sleeved or revert individual card sets.
- **FR-008**: System MUST support inventory deduction when games are marked as sleeved.
- **FR-009**: System MUST operate completely offline, persisting all sleeve requirements, inventory, and shopping states locally.
- **FR-010**: System MUST indicate sleeving completion status on each game card in the collection and 3D detail views.

### Key Entities

- **SleeveFormat**: Standard card sleeve category defining standard dimensions (e.g., Standard Card Game 63.5x88mm, European 59x92mm, Mini European 44x68mm, Tarot 70x120mm).
- **GameSleeveRequirement**: Specific sleeve demand for a game, linking game ID to dimensions, required card quantity, card set description (e.g. "Action Cards", "Objective Cards"), and sleeved status (boolean).
- **SleeveInventoryItem**: User-owned stock record tracking sleeve format/dimensions, brand label, pack size, total packs/sleeves owned, and storage notes.
- **SleeveShoppingItem**: Computed demand projection combining total required cards, allocated inventory, and net deficit in units and packs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 80% of imported popular board games automatically show pre-populated sleeve requirements without manual user entry.
- **SC-002**: The shopping list calculator computes net sleeve deficits across a 100-game collection in under 50 milliseconds.
- **SC-003**: 100% of sleeve specifications, inventory adjustments, and shopping lists are accessible and editable with zero network connection.
- **SC-004**: Users can record a new sleeve inventory item or mark a game as sleeved in fewer than 3 taps.
- **SC-005**: Zero inventory math discrepancy (total cards needed minus stock equals exact net deficit).

## Assumptions

- Dimensions are standardized and measured in millimeters (mm).
- Default pack sizes are typically 100 sleeves for standard thickness and 50 sleeves for premium thickness, with customizable pack quantities.
- Community sleeve data is compiled into a local offline reference table or bundled JSON catalog to guarantee offline availability.

