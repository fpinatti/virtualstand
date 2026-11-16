/**
 * Contract: 3D Parallel Aisle Shelf Layout & First-Person Camera Navigation (Feature 006)
 */

import { GameDimensionsSource, PlacedBoxCoords, ShelfDimensions } from '../../002-3d-virtual-shelf/contracts/shelf-layout-contract';

export type AisleSide = 'LEFT' | 'RIGHT';
export type CameraFocusSide = 'CENTER' | 'LEFT' | 'RIGHT';

export interface AisleShelfDimensions extends ShelfDimensions {
  aisleWidth: number;
  totalLength: number;
  totalHeight: number;
}

export interface PlacedAisleBox extends PlacedBoxCoords {
  side: AisleSide;
  baseRotationY: number;
}

export interface AisleCameraBounds {
  minZ: number;
  maxZ: number;
  defaultZ: number;
}

export interface AisleCameraPose {
  position: [x: number, y: number, z: number];
  yawRadians: number;
  focusSide: CameraFocusSide;
}

export interface AisleLayoutResult {
  aisle: AisleShelfDimensions;
  boxes: PlacedAisleBox[];
  cameraBounds: AisleCameraBounds;
}

export interface IAisleCameraController {
  /**
   * Clamps a target Z coordinate within valid corridor walking bounds.
   */
  clampCameraZ(targetZ: number, bounds: AisleCameraBounds): number;

  /**
   * Converts a vertical screen drag delta (in pixels) into a new clamped camera Z coordinate.
   */
  applyWalkDelta(currentZ: number, deltaPixelsY: number, bounds: AisleCameraBounds): number;

  /**
   * Computes the target camera position [x, y, z] and horizontal yaw angle (in radians)
   * for a given Z coordinate and focus side ('CENTER' | 'LEFT' | 'RIGHT').
   */
  computeCameraPose(currentZ: number, focusSide: CameraFocusSide, bounds: AisleCameraBounds): AisleCameraPose;

  /**
   * Determines whether a pointer gesture exceeded the drag threshold (walk gesture vs tap).
   */
  isDragGesture(totalDeltaX: number, totalDeltaY: number): boolean;
}
