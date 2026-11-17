# Feature Specification: Mobile UX & 3D Shelf Audit Fixes

**Feature Branch**: `014-mobile-ux-shelf-fixes`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "alguns ajustes gerais apos testar do celular: as imagens nao estao aparecendo na estante 3d. os icones do menu inferior (colecao, etc) estao com um retangulo, como se nao pudessem ser renderizados. na modal de detalhes de um jogo, remova o botao anexar pdf, remova a label ludopedia, remova as opcoes ler/renomear/excluir. a unica acao possivel é clicar no arquivo pra abrir. Quando clico pra ler, a app trava, fica uma tela escrito virtual stand e nao consigo sair dela mais. quando clico para esquerda/direita na estante 3d, preciso que a camera aumente o campo de visao pq esta muito zoom, preciso ver parte maior da prateleira"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clean & Safe One-Click Rulebook Opening in Game Details (Priority: P1)

As a board game player inspecting a game's details on my mobile phone,
I want a streamlined, uncluttered list of offline PDF rulebooks where clicking the document directly opens it safely without trapping me in a frozen screen,
So that I can consult game rules effortlessly and return to my collection at any time.

**Why this priority**: Opening rulebooks currently freezes the mobile application on a stuck "VirtualStand" screen with no exit mechanism, breaking a core app feature. Cleaning the modal actions directly resolves clutter and crashes.

**Independent Test**: Open any game details modal on a mobile device, verify that the "Anexar PDF", "Ludopedia", and "Ler/Renomear/Excluir" buttons are removed, tap directly on a rulebook card, verify the document opens smoothly with a visible close/back button, and verify exiting returns cleanly to the game details modal without freezing.

**Acceptance Scenarios**:

1. **Given** a user opens the details modal for any game with an attached rulebook, **When** viewing the "Manuais de Regras" section, **Then** only the clean rulebook item is displayed with no "Anexar PDF" button, no "Ludopedia" button, and no inline "Ler", "Renomear", or "Excluir" links.
2. **Given** a rulebook item in the details modal, **When** the user taps the item card, **Then** the details modal dismisses or suspends safely and the document reader opens immediately without locking the UI thread.
3. **Given** the document reader is active on mobile, **When** the user finishes reading or wants to exit, **Then** tapping the prominent top back/close button returns immediately to the previous screen with zero app crashes or infinite loading screens.

---

### User Story 2 - Render Authentic 3D Box Covers and Textures on Mobile (Priority: P1)

As a collector viewing my games in the 3D shelf on a mobile phone,
I want the authentic box cover art and spine textures to render correctly on the 3D meshes without blank or solid placeholder faces,
So that my virtual shelf looks like my real-world board game collection.

**Why this priority**: On mobile devices, 3D boxes are rendering without textures due to missing DOM globals (`document`/`Image`) in native Three.js texture loaders, diminishing visual immersion.

**Independent Test**: Launch the 3D shelf on a mobile device or simulator, scroll through the corridor, and verify that box front covers and spines display their downloaded images and rendered titles instead of generic fallback colors.

**Acceptance Scenarios**:

1. **Given** the user navigates to the 3D Shelf tab on mobile, **When** game boxes enter the camera frustum, **Then** each box displays its authentic front cover image and procedurally textured spine without crashing or throwing GL texture errors.
2. **Given** an offline or cached game image, **When** loaded into the 3D scene, **Then** texture dimensions are constrained within mobile GPU limits (<= 1024x1024) and aspect ratios are preserved without distortion.

---

### User Story 3 - Wider Field of View (FOV) on Lateral Shelf Camera Focus (Priority: P2)

As a user exploring the 3D shelf corridor,
I want the camera to zoom out and increase its field of view when I focus on the left or right wall,
So that I can see a broader span of the shelf cubbies and multiple game boxes together instead of an over-magnified close-up.

**Why this priority**: When tapping Left or Right, the current lateral camera pose steps too close to the boxes, restricting the user's peripheral vision and making shelf navigation disorienting.

**Independent Test**: Tap the LEFT or RIGHT focus button in the 3D shelf, verify the camera transitions smoothly to a wider FOV and stepped-back perspective, and verify that multiple adjacent shelf cubbies and boxes are comfortably visible simultaneously.

**Acceptance Scenarios**:

1. **Given** the camera is in the central corridor view, **When** the user selects the LEFT or RIGHT focus side, **Then** the camera increases its field of view (FOV >= 68°) and maintains comfortable clearance from the shelf wall.
2. **Given** the camera is focused on a shelf wall, **When** returning to the CENTER view, **Then** the camera smoothly interpolates back to the default central walking FOV and corridor alignment.

---

### User Story 4 - Render Crisp Native Bottom Tab Bar Icons on Mobile (Priority: P3)

As a user navigating between app tabs on mobile,
I want the bottom tab bar to display proper icons for "Coleção", "Estante 3D", and "Configurações" instead of missing-font rectangular glyph placeholders,
So that the navigation bar looks polished and clearly communicates each tab's destination.

**Why this priority**: Missing glyph boxes on the bottom menu degrade perceived software quality and make navigation ambiguous.

**Independent Test**: Observe the bottom tab bar on a physical mobile device, verify that all three tabs display crisp, recognizable icons with active/inactive tint colors and no rectangular font fallback boxes.

**Acceptance Scenarios**:

1. **Given** the app launches on an iOS or Android device, **When** viewing the bottom navigation bar, **Then** "Coleção", "Estante 3D", and "Configurações" display vector icons without missing glyph boxes.
2. **Given** the user switches between tabs, **When** a tab becomes active, **Then** its icon seamlessly highlights with `tokens.colors.accent.primary`.

---

### Edge Cases

- **Corrupted or Password-Protected PDF on Mobile**: If a PDF cannot be rendered by the viewer, display a clear inline error with an immediate "Voltar" action, ensuring the user is never stuck.
- **Large Collection 3D Texture Memory**: When scrolling rapidly through 100+ games on mobile, release out-of-view textures to prevent GPU memory spikes or mobile OS memory kills.
- **Offline Cover Images**: If a game's cover image has not yet been cached locally, fall back gracefully to a high-contrast procedural spine with readable typography, switching to the cover art once downloaded.
- **Rapid Lateral Direction Swapping**: Quickly toggling between LEFT and RIGHT must smoothly cancel running camera animations without jitter or camera flipping.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: In `GameDetailSheet`, the system MUST remove the "+ Anexar PDF", "🔍 Ludopedia", and "+ Anexar Arquivo PDF (PT-BR)" buttons.
- **FR-002**: In `RulebookList`, the system MUST remove the "Ler", "Renomear", and "Excluir" action buttons; tapping the rulebook item card MUST directly trigger opening the rulebook.
- **FR-003**: The system MUST ensure the document reader screen (`app/rulebook/[id].tsx`) safely dismisses any overlying modal before navigating, and MUST provide an always-visible, functional back button in the header and on error states.
- **FR-004**: The system MUST implement mobile-compatible texture resolution in `SpineGeneratorService` and `GameBoxMesh` that works in React Native / `expo-gl` environments without relying on browser DOM `document.createElement`.
- **FR-005**: In `AisleCameraController` and `ShelfScene`, the camera rig MUST support a wider field of view (FOV 68°–72°) and increased lateral offset when `focusSide` is `LEFT` or `RIGHT`, presenting a larger portion of the bookcase.
- **FR-006**: In `app/(tabs)/_layout.tsx`, the system MUST provide explicit, mobile-compatible vector icons for all navigation tabs (`collection`, `shelf`, `settings`), preventing missing-glyph box rendering.

### Key Entities

- **Rulebook**: Represents a verified physical manual PDF stored locally with its relative path, page count, and status.
- **AisleCameraPose**: Data structure defining 3D camera coordinates `[x, y, z]`, horizontal yaw rotation, and field of view for corridor navigation.
- **PlacedAisleBox**: Procedural box layout object containing physical dimensions, 3D world coordinates, shelf assignment, and cover image URI.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of rulebook card taps in `GameDetailSheet` open the document reader with zero UI lockups or frozen screens.
- **SC-002**: Exiting the document reader on mobile returns to the previous screen in under 200ms with a single tap.
- **SC-003**: Zero missing-glyph rectangle boxes appear in the mobile bottom navigation bar across iOS and Android.
- **SC-004**: In the 3D shelf, at least 3 vertical shelf cubby columns are visible simultaneously when focused on the left or right wall.
- **SC-005**: Game box cover art and procedural spines render on 100% of visible boxes on mobile devices without falling back to blank solid gray meshes.

## Assumptions

- Users test the application primarily using Expo Go and standalone mobile builds on Android and iOS.
- Local rulebook PDFs exist in `assets/rulebooks/` and are cataloged in `assets/data/virtualstand-catalog.json`.
- Standard Expo vector icons (`@expo/vector-icons` Ionicons or MaterialIcons) or custom SVG icons are used for tab bar icons with verified font loading.
- Native PDF viewing on Expo Go utilizes a safe fallback or modal document viewer with exit controls to avoid native library binary crashes.
