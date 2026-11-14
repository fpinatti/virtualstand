/**
 * Contract: 3D Box Rendering and Interaction Props
 */

import { PlacedBoxCoords } from './shelf-layout-contract';

export interface SpineStyleConfig {
  backgroundColor: string;
  textColor: string;
  title: string;
}

export interface Box3DProps {
  box: PlacedBoxCoords;
  isSelected: boolean;
  onSelect: (bggId: number) => void;
  onOpenDetails: (bggId: number) => void;
}

export interface ViewportCameraControls {
  target: [x: number, y: number, z: number];
  zoom: number;
  resetView: () => void;
}

