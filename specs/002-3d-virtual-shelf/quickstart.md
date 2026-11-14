# Quickstart Validation Guide: 3D Virtual Shelf

**Feature**: `002-3d-virtual-shelf`  
**Date**: 2026-11-14  
**Status**: Ready for Validation  

---

## 1. Prerequisites

Before testing or running the 3D shelf:
- Node.js $\ge 20$, Expo CLI
- Ensure Feature 001 (`001-bgg-collection-sync`) has imported at least 1-5 games into SQLite with box dimensions.

Refer to:
- [Data Model](data-model.md) for spatial coordinate conventions.
- [Shelf Layout Contract](contracts/shelf-layout-contract.ts) for placement data structures.
- [Box 3D Contract](contracts/box-3d-contract.ts) for interaction event handlers.

---

## 2. Automated Test Execution

### 2.1 Spatial Packing & Shelf Layout Tests
Validate that the packing algorithm correctly places boxes in cubbies without overlap:

```bash
# Run unit tests for spatial layout and coordinate calculations
npm test -- tests/unit/shelf-layout.test.ts tests/unit/spine-generator.test.ts
```
**Expected Outcome**:
- Boxes are placed side-by-side along the X-axis within the cubby width bound ($3.35$ scene units).
- Once a cubby is filled, boxes overflow gracefully into the next cubby or row.
- Scale conversions match the $1\text{ unit} = 10\text{ cm}$ rule.

---

## 3. Visual & Interactive Validation Scenarios

### Scenario A: 3D Shelf Rendering with Real-Scale Proportions
1. Launch app with `npm start` (or test on web / mobile simulator).
2. Tap the **Estante 3D** navigation tab.
3. **Validation Check**:
   - The modular bookcase renders with wooden or neutral dividers.
   - Games from the local SQLite collection appear upright inside the compartments.
   - Relative box proportions visually reflect reality (e.g. standard Euro games look identical in height and width, smaller games look compact).
   - Camera can be panned across the bookcase smoothly at 60 FPS.

### Scenario B: Legible Spines with Dynamic Color
1. Position the camera to look straight into a populated cubby.
2. **Validation Check**:
   - Each game displays its title clearly readable on its visible spine edge.
   - The spine background color is visually pleasant and harmonizes with the cover art.

### Scenario C: Touch Selection, Pull-Out & Inspection
1. Tap any game box on the shelf.
2. **Validation Check**:
   - The selected box smoothly slides forward out of the shelf (along $+Z$) toward the camera.
   - Drag a finger across the box: it rotates smoothly in 3D to reveal its front, top, and lateral faces.
   - Tap the extracted box: the game detail sheet (from Feature 001) slides up with notes, ratings, and options.
   - Tap outside the box: it slides smoothly back into its original resting place on the shelf.

