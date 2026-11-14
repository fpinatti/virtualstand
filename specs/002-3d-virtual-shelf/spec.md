# Feature Specification: Interactive 3D Virtual Shelf with Real-Scale Procedural Boxes

**Feature Branch**: `002-3d-virtual-shelf`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Estante virtual 3D interativa com caixas procedurais em proporções reais e gestos nativos"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-Scale 3D Shelf Visualization of User Collection (Priority: P1)

A board game collector navigates to the 3D shelf view to see their physical collection visualized as realistic boxes arranged inside a virtual modular bookcase (e.g., standard shelving units with proportional compartments). Every owned game is automatically constructed with real-world proportions (width, height, depth) derived from its physical edition data. The user can smoothly pan, zoom, and orbit the camera around the shelf using standard touch gestures without lag or stutter.

**Why this priority**: Core visual differentiator and MVP foundation. Transforming a flat list of games into an authentic, spatial 3D display provides immediate collector satisfaction and spatial recognition.

**Independent Test**: Open the 3D shelf tab with an imported collection; verify that games appear arranged in shelving cubbies with realistic proportions (e.g., standard Euro boxes look identical in scale, while card games appear noticeably smaller), and confirm camera gestures smoothly navigate across the entire bookcase.

**Acceptance Scenarios**:

1. **Given** a user with imported games in their local collection, **When** they open the 3D Shelf screen, **Then** a 3D bookcase scene renders showing their games positioned in shelf compartments.
2. **Given** games with varied physical dimensions (e.g. big box versus small card box), **When** rendered on the shelf, **Then** their relative sizes visually match their real-world physical packaging dimensions.
3. **Given** a user navigating the 3D scene, **When** they pinch to zoom or drag to pan, **Then** camera movements respond smoothly without frame drops or tearing.

---

### User Story 2 - Legible Game Spines with Dynamic Color & Title Generation (Priority: P2)

When games are arranged upright or side-by-side on the shelf (like books in a bookcase), users must be able to read the titles on the exposed spines. Because external databases rarely supply dedicated spine artwork, the system automatically analyzes the front cover to extract its dominant theme color and renders the game title clearly on the lateral spine face.

**Why this priority**: Critical for usability. A shelf where lateral box sides are blank or black creates a frustrating experience where users cannot identify their games without clicking every single one.

**Independent Test**: View games packed vertically in a shelf compartment; verify that the exposed spine face clearly displays the game title on a harmonized background color that matches the box theme.

**Acceptance Scenarios**:

1. **Given** games stored upright with only their spines visible, **When** the shelf renders, **Then** each box displays its title prominently and legibly along the spine face.
2. **Given** a game without a dedicated lateral spine texture, **When** the spine is generated, **Then** the background tone harmonizes with the dominant color of the front cover art, with high-contrast text.
3. **Given** game titles of varying lengths, **When** titles are drawn on the spine, **Then** font size scales dynamically to avoid truncation or clipping.

---

### User Story 3 - Tactile 3D Box Interaction, Pull-Out Animation & Inspection (Priority: P3)

A user browsing their virtual shelf taps a specific game box. The selected box smoothly slides forward out of the shelf with a natural spring animation, gently tilts toward the camera, and allows free 360-degree rotation for tactile inspection. Tapping the inspected box opens the full game overview sheet (presenting ratings, rulebook access, sleeve specs, and personal notes), while tapping the shelf background returns the box to its resting position.

**Why this priority**: Completes the immersive tactile experience, connecting 3D spatial browsing directly to game management actions.

**Independent Test**: Tap any game box on the shelf; observe it slide forward toward the user with smooth animation, rotate it via touch drag to view all faces, and tap to open its game details sheet.

**Acceptance Scenarios**:

1. **Given** a shelf of games, **When** the user taps on any box, **Then** that box smoothly slides out toward the user while others remain in place.
2. **Given** a pulled-out box, **When** the user drags their finger across the screen, **Then** the box rotates in 3D space to reveal front, back, and side surfaces.
3. **Given** a pulled-out box, **When** the user taps it again or taps an "Inspect Details" button, **Then** the detailed game sheet opens with personal notes, sleeve counts, and rulebook options.
4. **Given** a pulled-out box, **When** the user taps the empty shelf area or background, **Then** the box smoothly slides back into its compartment.

---

### Edge Cases

- **Games with Missing Cover Art**: If cover art is unavailable or failing to load, render a clean cardboard or stylized geometric texture with the game title clearly printed on both front and spine faces.
- **Extreme Box Sizes**: Mini card games (e.g., pocket games) and oversized mega-boxes (e.g., Gloomhaven) must fit logically into compartments without clipping through shelf dividers or floating in mid-air.
- **Large Collections (100+ Games)**: Shelves must automatically extend with multiple rows/columns, and off-camera cubbies must not consume rendering resources (culling) to protect frame rates.
- **Device Rotation (Portrait vs. Landscape)**: The 3D camera field-of-view and shelf layout must adapt smoothly without resetting the user's active pan or selected box state.
- **Offline Mode**: 100% of the 3D scene, materials, and cached textures must render perfectly when the device is completely disconnected from the network.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render an interactive 3D virtual bookcase displaying games from the user's local collection.
- **FR-002**: System MUST generate 3D box geometries procedurally at runtime using each game's stored physical dimensions (width, height, depth).
- **FR-003**: System MUST map cached front cover artwork onto the front face of each procedural 3D box with correct aspect ratio preservation.
- **FR-004**: System MUST dynamically generate readable lateral spine surfaces containing the game title and an aesthetically harmonized background tone when lateral art is absent.
- **FR-005**: System MUST provide fluid touch controls for camera panning, zooming, and tilting across the bookcase.
- **FR-006**: System MUST enable touch selection on individual boxes, causing the selected box to smoothly animate forward from the shelf compartment.
- **FR-007**: System MUST allow users to interactively rotate an extracted game box in all three dimensions to inspect its surfaces.
- **FR-008**: System MUST provide a direct pathway from an inspected 3D box to view and edit its metadata, personal ratings, sleeve inventory, and rulebooks.
- **FR-009**: System MUST automatically organize boxes into shelf cubbies by size and sequence, preventing visual overlaps or geometry clipping.
- **FR-010**: System MUST execute all rendering and gesture handling offline using locally cached assets and SQLite data.

### Key Entities

- **ShelfCompartment**: Spatial partition within the 3D bookcase defining dimensions (width, height, depth), maximum capacity, and local coordinate offsets.
- **VirtualBox3D**: Runtime 3D spatial entity representing a physical game box, linking canonical game identity, real-scale bounding box, multi-face material definitions, and rest/extracted transform states.
- **SpineTexture**: Procedurally generated visual asset representing the exposed edge of a box, combining background color extraction and rendered typographic title text.
- **CameraViewportState**: Coordinates, target focus point, zoom level, and orientation governing the user's current spatial perspective.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The 3D shelf maintains a steady 60 frames per second during camera panning and box animation on standard mobile hardware.
- **SC-002**: 100% of owned games in the local collection are viewable on the 3D shelf without requiring network connectivity.
- **SC-003**: 100% of game boxes display a legible title on their visible spines, regardless of whether lateral photos exist in external databases.
- **SC-004**: Tapping a box initiates its pull-out animation in under 16 milliseconds (within a single frame) with zero perceived touch latency.
- **SC-005**: Collections with up to 200 games load and become interactive in under 1.5 seconds from screen launch.
- **SC-006**: Pinch-to-zoom and pan gestures maintain continuous 1:1 finger tracking without jumping or disorientation.

## Assumptions

- The mobile device supports standard modern 3D graphics hardware acceleration.
- The majority of games will be displayed upright with their spine or front face exposed, matching typical home board game storage (e.g., Kallax-style shelves).
- Standard shelf compartment dimensions will be based on standard 33x33x38 cm storage cubes, with support for multi-compartment expansions for large collections.
- User-edited box dimensions (from feature 001) take precedence over automated estimations.

