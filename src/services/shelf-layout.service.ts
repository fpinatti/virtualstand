import {
  GameDimensionsSource,
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
   * Calculates 3D bookcase grid and packs games upright into cubbies.
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
      // When placed upright on shelf:
      // X-size (spine width along shelf) = depthCm / 10
      // Y-size (height) = heightCm / 10
      // Z-size (depth going into cubby) = widthCm / 10
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

    // Calculate total shelf outer bounds for centering
    const totalWidth = cols * cubbyWidth + (cols + 1) * thickness;
    const totalHeight = rows * cubbyHeight + (rows + 1) * thickness;
    const shelfOriginX = -totalWidth / 2;
    const shelfOriginY = totalHeight / 2;

    // 3. Position boxes in 3D space
    const boxes: PlacedBoxCoords[] = [];

    cubbyGroups.forEach((group, cubbyIdx) => {
      const col = cubbyIdx % cols;
      const row = Math.floor(cubbyIdx / cols);

      // Top-left origin of this cubby
      const cubbyLeft = shelfOriginX + thickness + col * (cubbyWidth + thickness);
      const cubbyTop = shelfOriginY - thickness - row * (cubbyHeight + thickness);
      const cubbyBottom = cubbyTop - cubbyHeight;
      const cubbyFrontZ = cubbyDepth / 2;

      let currentX = cubbyLeft + 0.05; // slight margin from left divider

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
}

export const shelfLayoutEngine = new ShelfLayoutEngine();

