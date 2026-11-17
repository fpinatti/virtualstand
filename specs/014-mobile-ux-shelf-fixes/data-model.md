# Data Model & Schema Impact: Mobile UX & 3D Shelf Audit Fixes

**Feature**: `014-mobile-ux-shelf-fixes`  
**Date**: 2026-11-17

## Entities & Interfaces

### 1. Updated `AisleCameraPose`

Extends the 3D camera pose structure to include dynamic field-of-view (FOV) calculation for wider lateral shelf viewing.

```typescript
export interface AisleCameraPose {
  /** 3D world position coordinates [x, y, z] */
  position: [number, number, number];
  /** Horizontal yaw angle in radians (0 = forward down corridor) */
  yawRadians: number;
  /** Vertical field of view in degrees (e.g. 54° for center, 70° for lateral focus) */
  fov: number;
  /** Active camera focus orientation */
  focusSide: CameraFocusSide;
}
```

### 2. Streamlined `RulebookListProps`

Eliminates unused callback mutations and simplifies rulebook action consumption down to direct item opening.

```typescript
export interface RulebookListProps {
  bggId: number;
  gameTitle?: string;
  onOpenRulebook?: (rulebookId: number) => void;
  onBeforeOpenReader?: () => void;
}
```

### 3. Tab Bar Navigation Manifest

Defines strict vector icon bindings for the mobile tab navigator.

```typescript
export interface TabNavigationItem {
  name: 'collection' | 'shelf' | 'settings';
  title: string;
  headerTitle: string;
  iconName: string;
  focusedIconName: string;
}
```

## Database Schema Changes

**Zero database migrations required**. The existing SQLite schema (`games`, `rulebooks`, `box_dimensions`, `collection_items`) remains unchanged and fully backward compatible.
