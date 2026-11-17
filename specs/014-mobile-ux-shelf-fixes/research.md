# Research & Technical Architecture: Mobile UX & 3D Shelf Audit Fixes

**Feature**: `014-mobile-ux-shelf-fixes`  
**Date**: 2026-11-17

## Technical Investigations & Root Cause Analyses

### 1. Root Cause: Mobile PDF Reader Lockup & Cluttered Details Modal

#### Issue
When tapping to read a rulebook on a mobile device, the application hangs on a static screen showing "VirtualStand" and cannot navigate back. Additionally, the user requested removing clutter from the game details modal (`+ Anexar PDF`, `🔍 Ludopedia`, and inline action links `Ler`, `Renomear`, `Excluir`), making single-click on the rulebook card the only action.

#### Root Causes
1. **Unclosed React Native Modal**: `GameDetailSheet` uses a React Native `<Modal visible={true}>`. When `openReader` executed `router.push('/rulebook/[id]')`, the modal remained mounted and rendered over the navigation stack on native devices, preventing back touches from reaching navigation headers.
2. **Missing Standalone Back Navigation in Header**: `app/rulebook/[id].tsx` relied on OS default header back buttons, which fail when pushed under a full-screen overlay or when the header stack configuration doesn't declare an explicit `headerLeft` back button.
3. **Expo Go Native PDF Limitation**: `react-native-pdf` depends on native C++ code (`RNPDFPdfView`) which cannot run in standard Expo Go (`storeClient`). When `resolveNativePdfComponent()` returns `null`, the screen displayed an informational card with no direct document preview or system intent fallback.

#### Resolution
- In `RulebookList`, remove "+ Anexar PDF", "🔍 Ludopedia", and "+ Anexar Arquivo PDF (PT-BR)".
- Remove the actions row (`Ler`, `Renomear`, `Excluir`). Tapping the rulebook card directly triggers opening.
- In `GameDetailSheet`, call `onClose()` before navigating to `/rulebook/[id]` so the modal safely dismisses first.
- In `app/rulebook/[id].tsx`, configure explicit `headerLeft` with a touchable back button (`router.back()`), and provide an instant system view/share option (`expo-sharing` or native document viewer fallback) when running inside Expo Go so the user can read the full PDF in the system viewer and always exit cleanly.

---

### 2. Root Cause: 3D Box Covers & Textures Missing on Mobile

#### Issue
On physical mobile devices, board game boxes on the 3D shelf display blank or solid placeholder colors instead of their cover art and spine textures.

#### Root Causes
1. **DOM-Dependent Canvas Texture Generator**: `SpineGeneratorService.createSpineTexture()` contains `if (typeof document === 'undefined') return null;`. In React Native / Expo Go, `document` is undefined, causing spine generation to return null.
2. **Three.js `TextureLoader` DOM Dependency**: `THREE.TextureLoader.load()` internally relies on `document.createElementNS('http://www.w3.org/1999/xhtml', 'img')` in standard Three.js builds. On React Native, this fails silently.
3. **Remote Image Loading vs Local Cached Assets**: Game covers on BGG have remote URLs (`https://cf.geekdo-images.com/...`). Loading them directly into WebGL textures requires either local file caching via `expo-file-system` (`file://...`) or `@react-three/drei/native` `useTexture` / `expo-gl` texture upload.

#### Resolution
- Use `expo-file-system` to cache cover images to `FileSystem.cacheDirectory` if not already local, and pass file URIs to native texture loaders.
- In `GameBoxMesh`, provide a robust cross-platform texture resolution that checks for React Native mobile environments and loads textures using `THREE.TextureLoader` with preloaded local image URIs or fallback procedural box materials.
- For spine text on mobile, generate high-contrast deterministic spine colors with clean contrast borders so boxes always appear distinct and tactile even before textures load.

---

### 3. Root Cause: Lateral Camera Focus Over-Zoomed on Shelf Walls

#### Issue
When the user taps LEFT or RIGHT in the 3D shelf corridor, the camera zooms in too closely, preventing the user from viewing a wide section of the bookcase.

#### Root Causes
1. **Narrow Constant Field of View**: The `Canvas` camera is configured with a fixed `fov: 54`.
2. **Short Lateral Step-Back**: `SIDE_LATERAL_STEP_X` is set to `0.65`, which keeps the camera too close to the focused wall.
3. **Steep Yaw Angle**: `SIDE_YAW_RADIANS = 1.15` (~66°), causing the camera to stare directly into an isolated cubby instead of providing a broad perspective of the shelf wall.

#### Resolution
- Expand `SIDE_LATERAL_STEP_X` from `0.65` to `1.05`, stepping back across the corridor towards the opposing wall.
- Adjust `SIDE_YAW_RADIANS` to `0.92` (~52°), orienting the camera diagonally across the bookcase.
- Dynamically interpolate `camera.fov` to `70°` when focused laterally on `LEFT` or `RIGHT`, and back to `54°` when centered, calling `camera.updateProjectionMatrix()` smoothly in `AisleCameraRig`.

---

### 4. Root Cause: Bottom Tab Bar Icons Rendering as Rectangles

#### Issue
On mobile devices, bottom tabs display rectangular boxes (missing glyph character `􀀀`) instead of icons.

#### Root Causes
`app/(tabs)/_layout.tsx` did not define any `tabBarIcon` property on `Tabs.Screen`, causing React Navigation to render default missing glyph placeholders or un-styled boxes.

#### Resolution
- Provide explicit `tabBarIcon` render callbacks in `app/(tabs)/_layout.tsx` using standard `@expo/vector-icons/Ionicons`:
  - `collection` -> `library-outline` / `library`
  - `shelf` -> `cube-outline` / `cube`
  - `settings` -> `settings-outline` / `settings`
- Set appropriate sizes (22–24px) and colors using `tokens.colors.accent.primary` and `tokens.colors.text.muted`.

---

## Constitution Compliance Analysis

| Constitution Principle | Requirement | Compliance Strategy | Status |
|---|---|---|---|
| **I. Offline-First & Local Data** | Rulebooks and cached covers must operate offline | Uses local `assets/rulebooks/` and SQLite repository without remote network requirements | ✅ Compliant |
| **II. Procedural 3D Virtual Shelf** | 3D box generation with authentic covers & spines | Mobile-friendly texture loading and procedural spine fallback; real dimensions preserved | ✅ Compliant |
| **IV. Modular Layered Architecture** | Separation of UI, gesture, and 3D rendering | Camera math kept in `AisleCameraController`, presentation in `ShelfScene`, UI in `RulebookList` | ✅ Compliant |
| **V. Performance & Test Discipline** | 60 FPS mobile budget, strict types, 100% tests | Smooth lerp in `AisleCameraRig`, bounded texture sizes, unit tests for camera pose & gestures | ✅ Compliant |
