/**
 * Contract: Spatial Shelf Layout Engine
 * Calculates 3D coordinates for bookcases, cubbies, and packed game boxes.
 */

export interface GameDimensionsSource {
  bggId: number;
  title: string;
  widthCm: number;
  heightCm: number;
  depthCm: number;
  isEstimated: boolean;
  thumbnailUri?: string | null;
}

export interface PlacedBoxCoords {
  bggId: number;
  title: string;
  thumbnailUri?: string | null;
  isEstimated: boolean;
  // Box dimensions in Three.js scene units (1 unit = 10cm)
  size: [width: number, height: number, depth: number];
  // Resting 3D position
  position: [x: number, y: number, z: number];
  // Target position when pulled out for inspection
  extractedPosition: [x: number, y: number, z: number];
  cubbyIndex: number;
}

export interface ShelfDimensions {
  rows: number;
  cols: number;
  cubbyWidth: number;  // 3.35
  cubbyHeight: number; // 3.35
  cubbyDepth: number;  // 3.90
  thickness: number;   // 0.20
}

export interface IShelfLayoutEngine {
  /**
   * Computes the bookcase grid dimensions and positions all boxes.
   */
  calculateLayout(games: GameDimensionsSource[]): {
    shelf: ShelfDimensions;
    boxes: PlacedBoxCoords[];
  };
}

