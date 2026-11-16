import {
  AisleCameraBounds,
  AisleCameraPose,
  CameraFocusSide,
  IAisleCameraController,
} from '@/components/shelf-3d/types';

export const WALK_SENSITIVITY_Z_PER_PX = 0.016;
export const DRAG_THRESHOLD_PX = 8;
export const SIDE_YAW_RADIANS = 1.15; // ~66 degrees toward selected shelf wall
export const SIDE_LATERAL_STEP_X = 0.65; // Steps slightly back from focused wall for wider framing

export class AisleCameraController implements IAisleCameraController {
  /**
   * Clamps a target Z coordinate within valid corridor walking bounds [minZ, maxZ].
   */
  clampCameraZ(targetZ: number, bounds: AisleCameraBounds): number {
    if (!Number.isFinite(targetZ)) {
      return bounds.defaultZ;
    }
    const low = Math.min(bounds.minZ, bounds.maxZ);
    const high = Math.max(bounds.minZ, bounds.maxZ);
    return Math.max(low, Math.min(high, targetZ));
  }

  /**
   * Converts a vertical screen drag delta (in pixels) into a new clamped camera Z coordinate.
   * Dragging finger up (negative deltaY) or down (positive deltaY) walks along the corridor.
   */
  applyWalkDelta(currentZ: number, deltaPixelsY: number, bounds: AisleCameraBounds): number {
    if (!Number.isFinite(deltaPixelsY)) {
      return this.clampCameraZ(currentZ, bounds);
    }
    const nextZ = currentZ + deltaPixelsY * WALK_SENSITIVITY_Z_PER_PX;
    return this.clampCameraZ(nextZ, bounds);
  }

  /**
   * Computes the target camera position [x, y, z] and horizontal yaw angle (in radians)
   * for a given Z coordinate and focus side ('CENTER' | 'LEFT' | 'RIGHT').
   */
  computeCameraPose(
    currentZ: number,
    focusSide: CameraFocusSide,
    bounds: AisleCameraBounds
  ): AisleCameraPose {
    const clampedZ = this.clampCameraZ(currentZ, bounds);

    if (focusSide === 'LEFT') {
      return {
        position: [SIDE_LATERAL_STEP_X, 0.15, clampedZ],
        yawRadians: SIDE_YAW_RADIANS,
        focusSide: 'LEFT',
      };
    }

    if (focusSide === 'RIGHT') {
      return {
        position: [-SIDE_LATERAL_STEP_X, 0.15, clampedZ],
        yawRadians: -SIDE_YAW_RADIANS,
        focusSide: 'RIGHT',
      };
    }

    return {
      position: [0, 0.15, clampedZ],
      yawRadians: 0,
      focusSide: 'CENTER',
    };
  }

  /**
   * Determines whether a pointer gesture exceeded the drag threshold (walk gesture vs tap).
   */
  isDragGesture(totalDeltaX: number, totalDeltaY: number): boolean {
    const distance = Math.hypot(totalDeltaX, totalDeltaY);
    return distance > DRAG_THRESHOLD_PX;
  }
}

export const aisleCameraController = new AisleCameraController();
