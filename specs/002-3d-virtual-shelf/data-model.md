# Data Model: 3D Virtual Shelf Spatial Layout & Interaction

**Feature**: `002-3d-virtual-shelf`  
**Date**: 2026-11-14  
**Status**: Completed  

---

## 1. Spatial Entities & Data Flow

```mermaid
erDiagram
    SHELF_LAYOUT ||--o{ SHELF_CUBBY : "contains"
    SHELF_CUBBY ||--o{ PLACED_BOX_3D : "holds"
    PLACED_BOX_3D ||--|| BOX_MATERIAL_SET : "renders with"
    PLACED_BOX_3D ||--|| BOX_INTERACTION_STATE : "tracks"

    SHELF_LAYOUT {
        int rows "Number of vertical shelf rows"
        int cols "Number of horizontal shelf columns"
        real cubby_width "Interior width (scene units, 3.35)"
        real cubby_height "Interior height (scene units, 3.35)"
        real cubby_depth "Interior depth (scene units, 3.90)"
        real shelf_thickness "Plank thickness (0.20)"
    }

    SHELF_CUBBY {
        int row_index "0-indexed row position"
        int col_index "0-indexed column position"
        real origin_x "Center X coordinate in scene space"
        real origin_y "Center Y coordinate in scene space"
        real origin_z "Center Z coordinate in scene space"
        real occupied_width "Sum of box depths packed so far"
    }

    PLACED_BOX_3D {
        int bgg_id PK "Canonical game identifier"
        string title "Game title"
        real width_scene "Scaled box width (width_cm / 10)"
        real height_scene "Scaled box height (height_cm / 10)"
        real depth_scene "Scaled box depth (depth_cm / 10)"
        real rest_x "Resting X coordinate on shelf"
        real rest_y "Resting Y coordinate on shelf"
        real rest_z "Resting Z coordinate on shelf"
        real extracted_z "Pulled-out Z coordinate for inspection"
        int is_estimated "Flag if fallback dimensions were used"
    }

    BOX_MATERIAL_SET {
        string front_cover_uri "Local cached cover image URI"
        string spine_bg_color "Hex or RGB dominant color code"
        string spine_title "Formatted title text"
    }
```

---

## 2. Spatial Types & Invariants

### 2.1 Coordinate Space Convention
- **Coordinate System**: Right-handed Cartesian coordinates:
  - $+X$: To the right across the shelf.
  - $+Y$: Upwards toward upper shelf rows.
  - $+Z$: Outwards toward the camera/user.
- **Scale Factor**: $1\text{ Scene Unit} = 10.0\text{ cm}$.
- **Origin `[0, 0, 0]`**: Center of the overall bookcase assembly.

### 2.2 Placement Packing Logic
For each game with dimensions $(w_{cm}, h_{cm}, d_{cm})$:
1. Converted size in scene units:
   $$\text{boxWidth} = \frac{w_{cm}}{10},\quad \text{boxHeight} = \frac{h_{cm}}{10},\quad \text{boxThickness} = \frac{d_{cm}}{10}$$
2. Stored upright with spine exposed:
   - Visible spine width along shelf $= \text{boxThickness}$.
   - Vertical height $= \text{boxHeight}$.
   - Depth inside cubby $= \text{boxWidth}$.
3. If current cubby's $\text{occupiedWidth} + \text{boxThickness} > 3.35$, advance packing cursor to next cubby $(\text{col} + 1)$ or next row $(\text{row} + 1)$.

---

## 3. Interaction State Machine

```mermaid
stateDiagram-v2
    [*] --> RESTING
    RESTING --> ANIMATING_OUT : Tap Box (Raycast)
    ANIMATING_OUT --> EXTRACTED : Transition Complete (Z + 1.8)
    EXTRACTED --> ROTATING : Finger Drag Gesture
    ROTATING --> EXTRACTED : Release Drag
    EXTRACTED --> OPENING_DETAILS : Tap Extracted Box
    OPENING_DETAILS --> EXTRACTED : Close Details Sheet
    EXTRACTED --> ANIMATING_IN : Tap Background / Outside
    ANIMATING_IN --> RESTING : Returned to Shelf
```

