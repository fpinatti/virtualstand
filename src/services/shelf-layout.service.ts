import {
  AisleCameraBounds,
  AisleLayoutResult,
  AisleShelfDimensions,
  AisleSide,
  GameDimensionsSource,
  PlacedAisleBox,
  PlacedBoxCoords,
  ShelfDimensions,
  IShelfLayoutEngine,
} from '@/components/shelf-3d/types';

export class ShelfLayoutEngine implements IShelfLayoutEngine {
  private readonly defaultShelf: ShelfDimensions = {
    rows: 2,
    cols: 2,
    cubbyWidth: 3.35,
    cubbyHeight: 3.35,
    cubbyDepth: 3.90,
    thickness: 0.20,
  };

  /**
   * Calculates 3D bookcase grid and packs games upright into cubbies (single shelf contract).
   */
  calculateLayout(games: GameDimensionsSource[]): {
    shelf: ShelfDimensions;
    boxes: PlacedBoxCoords[];
  } {
    const { cubbyWidth, cubbyHeight, cubbyDepth, thickness } = this.defaultShelf;

    // 1. Pack games into cubby groups based on accumulated spine thickness
    const cubbyGroups: Array<Array<{ game: GameDimensionsSource; size: [number, number, number] }>> = [];
    let currentCubby: Array<{ game: GameDimensionsSource; size: [number, number, number] }> = [];
    let currentOccupiedWidth = 0;

    for (const game of games) {
      // 1 Three.js unit = 10 cm
      const boxSpineWidth = Math.max(0.2, (game.depthCm || 7.1) / 10);
      const boxHeight = Math.min(cubbyHeight - 0.1, Math.max(0.5, (game.heightCm || 29.7) / 10));
      const boxDepth = Math.min(cubbyDepth - 0.1, Math.max(0.5, (game.widthCm || 29.7) / 10));

      const boxSize: [number, number, number] = [boxSpineWidth, boxHeight, boxDepth];

      if (currentOccupiedWidth + boxSpineWidth > cubbyWidth && currentCubby.length > 0) {
        cubbyGroups.push(currentCubby);
        currentCubby = [];
        currentOccupiedWidth = 0;
      }

      currentCubby.push({ game, size: boxSize });
      currentOccupiedWidth += boxSpineWidth;
    }

    if (currentCubby.length > 0 || cubbyGroups.length === 0) {
      cubbyGroups.push(currentCubby);
    }

    // 2. Determine bookcase rows & columns (minimum 2x2)
    const totalCubbies = Math.max(4, cubbyGroups.length);
    const cols = totalCubbies <= 4 ? 2 : totalCubbies <= 9 ? 3 : 4;
    const rows = Math.max(2, Math.ceil(totalCubbies / cols));

    const shelf: ShelfDimensions = {
      ...this.defaultShelf,
      rows,
      cols,
    };

    const totalWidth = cols * cubbyWidth + (cols + 1) * thickness;
    const totalHeight = rows * cubbyHeight + (rows + 1) * thickness;
    const shelfOriginX = -totalWidth / 2;
    const shelfOriginY = totalHeight / 2;

    // 3. Position boxes in 3D space
    const boxes: PlacedBoxCoords[] = [];

    cubbyGroups.forEach((group, cubbyIdx) => {
      const col = cubbyIdx % cols;
      const row = Math.floor(cubbyIdx / cols);

      const cubbyLeft = shelfOriginX + thickness + col * (cubbyWidth + thickness);
      const cubbyTop = shelfOriginY - thickness - row * (cubbyHeight + thickness);
      const cubbyBottom = cubbyTop - cubbyHeight;
      const cubbyFrontZ = cubbyDepth / 2;

      let currentX = cubbyLeft + 0.05;

      group.forEach(({ game, size }) => {
        const [w, h, d] = size;
        const posX = currentX + w / 2;
        const posY = cubbyBottom + h / 2;
        const posZ = cubbyFrontZ - d / 2;

        boxes.push({
          bggId: game.bggId,
          title: game.title,
          thumbnailUri: game.thumbnailUri,
          isEstimated: game.isEstimated,
          size,
          position: [posX, posY, posZ],
          extractedPosition: [posX, posY + 0.2, posZ + 1.8],
          cubbyIndex: cubbyIdx,
        });

        currentX += w;
      });
    });

    return { shelf, boxes };
  }

  /**
   * Calculates the 3D Library Aisle layout with parallel LEFT and RIGHT multi-tier bookcases
   * extending along the negative Z corridor axis, matching the library aisle perspective.
   */
  calculateAisleLayout(games: GameDimensionsSource[]): AisleLayoutResult {
    const cubbyWidth = 3.25; // Width along the corridor Z axis
    const cubbyHeight = 1.75; // Vertical height per shelf tier (allows 4 comfortable tiers)
    const cubbyDepth = 1.85; // Depth into the left/right walls along X axis
    const thickness = 0.14;
    const aisleWidth = 3.60; // Free walkway width between left and right shelf fronts (-1.80 to +1.80)
    const rows = 4; // 4 shelf tiers per wall, matching the library reference photo

    // 1. Group games into cubbies along the shelf bay width
    const cubbyGroups: Array<Array<{ game: GameDimensionsSource; size: [number, number, number] }>> = [];
    let currentCubby: Array<{ game: GameDimensionsSource; size: [number, number, number] }> = [];
    let currentOccupiedWidth = 0;

    for (const game of games) {
      // Scale box height to fit comfortably inside the 4-tier library shelf height
      const boxSpineWidth = Math.max(0.22, Math.min(0.65, (game.depthCm || 7.1) / 10));
      const rawHeight = (game.heightCm || 29.7) / 10;
      const boxHeight = Math.min(cubbyHeight - 0.16, Math.max(0.85, rawHeight * 0.52));
      const rawDepth = (game.widthCm || 29.7) / 10;
      const boxDepth = Math.min(cubbyDepth - 0.15, Math.max(0.85, rawDepth * 0.52));

      const boxSize: [number, number, number] = [boxSpineWidth, boxHeight, boxDepth];

      if (currentOccupiedWidth + boxSpineWidth > cubbyWidth - 0.12 && currentCubby.length > 0) {
        cubbyGroups.push(currentCubby);
        currentCubby = [];
        currentOccupiedWidth = 0;
      }

      currentCubby.push({ game, size: boxSize });
      currentOccupiedWidth += boxSpineWidth;
    }

    if (currentCubby.length > 0) {
      cubbyGroups.push(currentCubby);
    }

    // 2. Alternate cubbies between LEFT and RIGHT walls so both sides are balanced
    // Each wall has `rows` (4) tiers per depth column (`col`).
    const cubbiesPerWall = Math.ceil(cubbyGroups.length / 2);
    const cols = Math.max(4, Math.ceil(cubbiesPerWall / rows));

    const totalLength = cols * cubbyWidth + (cols + 1) * thickness;
    const totalHeight = rows * cubbyHeight + (rows + 1) * thickness;

    const aisle: AisleShelfDimensions = {
      rows,
      cols,
      cubbyWidth,
      cubbyHeight,
      cubbyDepth,
      thickness,
      aisleWidth,
      totalLength,
      totalHeight,
    };

    const halfAisle = aisleWidth / 2; // 1.80
    const shelfTopY = totalHeight / 2;
    // Corridor starts at Z = 0 and extends into -totalLength
    const boxes: PlacedAisleBox[] = [];

    cubbyGroups.forEach((group, groupIdx) => {
      const side: AisleSide = groupIdx % 2 === 0 ? 'LEFT' : 'RIGHT';
      const wallCubbyIndex = Math.floor(groupIdx / 2);

      // Fill front-to-back along Z, cycling through the middle/eye-level rows first for small collections
      const rowOrder = [1, 2, 0, 3];
      const col = Math.floor(wallCubbyIndex / rows);
      const row = rowOrder[wallCubbyIndex % rows];

      const bayFrontZ = -(thickness + col * (cubbyWidth + thickness));
      const cubbyTop = shelfTopY - thickness - row * (cubbyHeight + thickness);
      const cubbyBottom = cubbyTop - cubbyHeight;

      let cursorZ = bayFrontZ - 0.08;

      group.forEach(({ game, size }) => {
        const [spineW, boxH, boxD] = size;
        const posZ = cursorZ - spineW / 2;
        const posY = cubbyBottom + boxH / 2;

        // When rotated by +/-90 deg around Y:
        // Local Z axis maps to World +X (for LEFT wall, rotationY = +PI/2)
        // or World -X (for RIGHT wall, rotationY = -PI/2).
        // Front edge of shelf is at X = -halfAisle (LEFT) or X = +halfAisle (RIGHT).
        const posX =
          side === 'LEFT'
            ? -halfAisle - boxD / 2 - 0.04
            : halfAisle + boxD / 2 + 0.04;

        const extractedX =
          side === 'LEFT'
            ? -halfAisle + 0.85
            : halfAisle - 0.85;

        const baseRotationY = side === 'LEFT' ? Math.PI / 2 : -Math.PI / 2;

        boxes.push({
          bggId: game.bggId,
          title: game.title,
          thumbnailUri: game.thumbnailUri,
          isEstimated: game.isEstimated,
          side,
          baseRotationY,
          size,
          position: [posX, posY, posZ],
          extractedPosition: [extractedX, posY + 0.12, posZ],
          cubbyIndex: groupIdx,
        });

        cursorZ -= spineW + 0.02;
      });
    });

    const cameraBounds: AisleCameraBounds = {
      maxZ: 1.8,
      minZ: Math.min(-2.5, -totalLength + 2.8),
      defaultZ: 1.2,
    };

    return {
      aisle,
      boxes,
      cameraBounds,
    };
  }
}

export const shelfLayoutEngine = new ShelfLayoutEngine();
