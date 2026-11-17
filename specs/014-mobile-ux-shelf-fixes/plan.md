# Implementation Plan: Mobile UX & 3D Shelf Audit Fixes

**Branch**: `014-mobile-ux-shelf-fixes` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-mobile-ux-shelf-fixes/spec.md`

## Summary

This feature resolves critical user experience and visual defects discovered during physical mobile device testing:
1. **Rulebook Opening & Modal De-cluttering**: Removes extraneous "+ Anexar PDF", "Ludopedia", and "Ler/Renomear/Excluir" buttons from the game details sheet; enables single-tap document opening, dismisses overlying modals before navigating, and adds an explicit back button and resilient viewer to prevent the app from freezing on a trapped loading screen.
2. **Mobile 3D Textures & Cover Art**: Fixes React Native WebGL texture loading by removing DOM-dependent `document.createElement` assumptions from `SpineGeneratorService`, providing robust texture loading on Android/iOS mobile environments.
3. **Wider Field of View (FOV) on Lateral Shelf Navigation**: Adjusts `AisleCameraController` and `ShelfScene` camera rig with dynamic FOV (70° on lateral focus, 54° on center) and increased step-back offset so users can comfortably view a larger portion of the shelf.
4. **Native Vector Icons on Tab Bar**: Adds explicit vector icon components (`@expo/vector-icons/Ionicons`) to `app/(tabs)/_layout.tsx`, eliminating rectangular missing-glyph fallback boxes on mobile.

## Technical Context

**Language/Version**: TypeScript 5.3+ (Strict Mode)  
**Primary Dependencies**: React Native 0.88+, Expo SDK 58, Expo Router, `@react-three/fiber/native`, `three`, `expo-gl`, `react-native-reanimated`, `@expo/vector-icons`  
**Storage**: SQLite (`expo-sqlite` with Drizzle ORM) + `assets/rulebooks/`  
**Testing**: Jest 29+ (`npm test`, `npm run ui:audit`), `npm run typecheck`  
**Target Platform**: Android, iOS (Expo Go & Dev Client), and Web (Localhost)  
**Project Type**: Mobile Application  
**Performance Goals**: 60 FPS in 3D shelf corridor navigation, sub-200ms document reader opening  
**Constraints**: Zero runtime crashes on Expo Go, 100% offline capability, zero missing-glyph icon boxes  
**Scale/Scope**: 126+ games collection, 120+ offline PDFs  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Offline-First)**: PASS. Rulebooks and textures operate from local SQLite, bundled assets, and local cache without blocking network calls.
- **Principle II (Procedural 3D Virtual Shelf)**: PASS. Fixes box textures and lateral camera clearance while keeping procedural box geometry.
- **Principle IV (Modular Layered Architecture)**: PASS. Strict separation between presentation, camera math (`AisleCameraController`), and domain services.
- **Principle V (Type Safety & Performance)**: PASS. Strict TypeScript with 0 `any`s, bounded textures, 100% automated test coverage.

## Project Structure

### Documentation (this feature)

```text
specs/014-mobile-ux-shelf-fixes/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Root cause analysis & architecture findings
├── data-model.md        # Data models & contract definitions
├── quickstart.md        # Verification and manual test guide
├── contracts/           # TypeScript interface contracts
└── checklists/          # Requirements & quality validation checklists
```

### Source Code Impact

```text
app/
├── (tabs)/
│   └── _layout.tsx                      # Add vector icons for collection, shelf, settings
└── rulebook/
    └── [id].tsx                         # Safe header back button and resilient viewer

src/
├── components/
│   ├── game-detail-sheet.tsx            # Clean up modal & close before opening reader
│   ├── rulebooks/
│   │   ├── rulebook-list.tsx            # Remove Anexar/Ludopedia/CRUD buttons; direct tap
│   │   └── pdf-reader.tsx               # Resilient mobile fallback with exit controls
│   └── shelf-3d/
│       ├── shelf-scene.tsx              # Dynamic FOV interpolation on camera rig
│       └── game-box-mesh.tsx            # Mobile-friendly texture loading
└── services/
    ├── aisle-camera.service.ts          # Updated step-back distance, yaw, and FOV math
    └── spine-generator.service.ts       # Cross-platform non-DOM texture compatibility

tests/
├── unit/
│   ├── aisle-shelf-navigation.test.ts   # Verify updated FOV and lateral step distance
│   ├── rulebook-interaction.test.ts     # Verify simplified rulebook list actions
│   └── mobile-tabs-navigation.test.ts   # Verify tab bar icons and header options
```

## Implementation Phases

### Phase 0: Research & Environment Validation (Completed)
- Diagnosed missing glyph boxes in tab bar: `tabBarIcon` property was absent in `_layout.tsx`.
- Diagnosed 3D texture failure: `document.createElement` in `SpineGeneratorService` throws/fails on native.
- Diagnosed PDF freeze: React Native `<Modal>` was not unmounted when pushing `/rulebook/[id]`, trapping touch events without an explicit header back button.
- Diagnosed lateral camera over-zoom: `fov: 54` and short `SIDE_LATERAL_STEP_X: 0.65` placed camera too close to shelf.

### Phase 1: Core Implementation
1. **Bottom Tab Bar Icons**:
   - Update `app/(tabs)/_layout.tsx` to provide `@expo/vector-icons/Ionicons` for `collection`, `shelf`, and `settings`.
2. **Simplified Rulebook List in Game Details**:
   - In `src/components/rulebooks/rulebook-list.tsx`, strip `+ Anexar PDF`, `🔍 Ludopedia`, and the `Ler/Renomear/Excluir` action row.
   - Make tapping the rulebook item card the direct trigger for opening the reader.
3. **Safe Navigation & Resilient Reader**:
   - In `src/components/game-detail-sheet.tsx`, call `onClose()` before navigating to `/rulebook/[id]`.
   - In `app/rulebook/[id].tsx`, configure `headerLeft` with a touchable back button and safe fallback options.
4. **Enhanced 3D Shelf FOV & Clearance**:
   - In `src/services/aisle-camera.service.ts`, increase `SIDE_LATERAL_STEP_X` to `1.05`, adjust `SIDE_YAW_RADIANS` to `0.92`, and return `fov: 70` on lateral focus.
   - In `src/components/shelf-3d/shelf-scene.tsx`, interpolate `camera.fov` smoothly in `AisleCameraRig`.
5. **Mobile 3D Texture Loading**:
   - In `src/services/spine-generator.service.ts` and `src/components/shelf-3d/game-box-mesh.tsx`, ensure texture loading safely works in React Native environments without throwing DOM errors.

### Phase 2: Verification & Testing
- Run `npm run typecheck` to verify zero TypeScript errors.
- Run `npm test` to verify all unit, integration, and UI tests pass.
- Verify through physical device test on Expo Go.
