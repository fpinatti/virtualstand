# Research & Architecture Decisions: 3D Virtual Shelf

**Feature**: `002-3d-virtual-shelf`  
**Date**: 2026-11-14  
**Status**: Completed  

---

## 1. 3D Engine & Viewport Pipeline in Expo

### Context
Per Constitution Principle II, the 3D virtual shelf must deliver a fluid 60 FPS mobile experience with realistic lighting, materials, and proportional box geometries without requiring individual pre-modeled 3D asset files.

### Decision
- Use `@react-three/fiber/native` combined with `three` and `expo-gl`.
- Viewport hierarchy:
  - `<Canvas>` hosted inside standard React Native view.
  - Scene lighting: Soft `ambientLight` (intensity 0.6) paired with two directional lights (key light at `[5, 10, 7]` and fill light at `[-5, 5, 5]`) to accentuate shelf compartment depth and box edge bevels.
  - Camera: Perspective camera with $45^\circ$ Field of View (FOV) and near/far clipping planes at `[0.1, 100]`.

### Rationale
- React Three Fiber provides declarative scene composition while compiling directly to native OpenGL/WebGL commands via `expo-gl`.
- Retains 100% interoperability with Three.js shaders, raycasting, and texture management with zero C++ bridging required.

### Alternatives Considered
- *Raw OpenGL / Filament C++*: High initial overhead and poor cross-platform web/mobile code sharing.
- *Unity / Unreal embed*: Massive bundle size bloat (>50MB engine binary) and complex interop with SQLite data.

---

## 2. Procedural Scale & Modular Bookcase Layout

### Context
Board games vary drastically in physical size (e.g. standard Euro boxes, small card tuckboxes, and oversized Kickstarter big boxes). They must be positioned inside realistic shelving units without visual clipping or floating.

### Decision
- **Unit Scaling Invariant**: 1 Three.js unit = 10.0 cm ($0.1\text{ m}$).
  - A $29.7 \times 29.7 \times 7.1\text{ cm}$ game is sized as `width = 2.97`, `height = 2.97`, `depth = 0.71`.
- **Modular Cubby Specification**: Standard Kallax-style compartment dimensions:
  - Interior Width: $33.5\text{ cm}$ (`3.35` scene units)
  - Interior Height: $33.5\text{ cm}$ (`3.35` scene units)
  - Interior Depth: $39.0\text{ cm}$ (`3.90` scene units)
  - Outer Shelf Thickness: $2.0\text{ cm}$ (`0.20` scene units)
- **Packing Algorithm**:
  - Games are placed vertically side-by-side along the X-axis of each cubby (spines facing outward).
  - When the cumulative thickness ($\sum depth$) exceeds the cubby interior width ($3.35$), the packing cursor advances to the next compartment.
  - Multi-cubby grid scales dynamically (e.g., $2 \times 2$, $3 \times 3$, or $4 \times 4$ compartments based on collection size).

### Rationale
- Physical proportion mapping mirrors real-life collector bookcases, creating instant recognition of familiar titles.
- Modular cubby scaling naturally organizes collections from 5 to 200+ games.

### Alternatives Considered
- *Uniform box sizes*: Destroys the authentic look and feel of real board game collections.
- *Physics engine simulation (Cannon/Rapier) for shelf packing*: Unnecessary CPU overhead and unstable resting jitter. Deterministic mathematical placement is instantaneous and 100% predictable.

---

## 3. Dynamic Spine Texture Generation & Multi-Material Array

### Context
While front cover art is readily available from BGG thumbnails, side spine images are almost never available in external APIs. Blank or monochromatic spines make games unrecognizable on a shelf.

### Decision
- Use a Three.js multi-material array for the 6 faces of `BoxGeometry`:
  - Face 0 (+X / Right side): Neutral/cardboard tone.
  - Face 1 (-X / Left side): Neutral/cardboard tone.
  - Face 2 (+Y / Top): Neutral/cardboard tone.
  - Face 3 (-Y / Bottom): Neutral/cardboard tone.
  - Face 4 (+Z / Front face): High-resolution cover art texture.
  - Face 5 (-Z / Spine face exposed outward): Procedural Canvas/data-URI texture containing:
    1. A dominant background tone extracted from the cover art palette.
    2. The title of the game rendered in high-contrast crisp typography (scaled dynamically to fit length).
- Texture caching: Generated spine textures are cached in an in-memory `Map<number, THREE.CanvasTexture>` to prevent redundant re-renders.

### Rationale
- Guarantees 100% of games are immediately identifiable on the shelf without manual photo uploads.
- Canvas textures are generated offscreen in milliseconds and consume negligible GPU memory (<64KB per spine).

### Alternatives Considered
- *Blank black/gray spines*: Very poor user experience; user cannot read what game is on the shelf.
- *3D Text meshes for spines*: Too many polygons per box; causes noticeable frame drops with 50+ games on screen.

---

## 4. Tactile Touch & Gesture Interaction

### Context
Users want to interact with the 3D shelf naturally: panning across shelves, tapping a box to inspect it, rotating the box in 3D, and opening game details.

### Decision
- **Raycasting Touch Detection**: Use Three.js raycasting via pointer events to determine which box was tapped.
- **State-Driven Animation**:
  - Rest State: Position `[x_rest, y_rest, z_rest]`, rotation `[0, 0, 0]`.
  - Extracted State: Pulled forward by $+1.8$ units along the Z-axis, elevated slightly, and oriented toward the camera.
  - Native gesture handler (`PanGesture`): When a box is extracted, horizontal and vertical finger drags map directly to local box Euler angles `[rotX, rotY]`.
- **Dismissal & Action**:
  - Tapping an extracted box triggers the `GameDetailSheet` (from Feature 001).
  - Tapping anywhere outside the active box returns it to its rest position with a smooth dampening interpolation.

### Rationale
- Smooth state interpolation provides tactile delight while maintaining strict separation between presentation and data layers.
- Seamless integration with Feature 001 allows immediate access to personal notes, sleeve counts, and rulebooks.

