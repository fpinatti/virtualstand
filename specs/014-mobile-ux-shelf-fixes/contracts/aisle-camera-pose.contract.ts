import { AisleCameraBounds, CameraFocusSide } from '@/components/shelf-3d/types';

export interface AisleCameraPoseContract {
  position: [number, number, number];
  yawRadians: number;
  fov: number;
  focusSide: CameraFocusSide;
}

export interface IAisleCameraControllerContract {
  clampCameraZ(targetZ: number, bounds: AisleCameraBounds): number;
  applyWalkDelta(currentZ: number, deltaPixelsY: number, bounds: AisleCameraBounds): number;
  computeCameraPose(
    currentZ: number,
    focusSide: CameraFocusSide,
    bounds: AisleCameraBounds
  ): AisleCameraPoseContract;
  isDragGesture(totalDeltaX: number, totalDeltaY: number): boolean;
}
