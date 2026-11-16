import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/db/client';
import { games, collectionItems, boxDimensions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  AisleCameraBounds,
  AisleShelfDimensions,
  GameDimensionsSource,
  PlacedAisleBox,
  PlacedBoxCoords,
  ShelfDimensions,
} from '@/components/shelf-3d/types';
import { shelfLayoutEngine } from '@/services/shelf-layout.service';

export function useShelfCollection() {
  const [boxes, setBoxes] = useState<PlacedBoxCoords[]>([]);
  const [shelf, setShelf] = useState<ShelfDimensions | null>(null);
  const [aisle, setAisle] = useState<AisleShelfDimensions | null>(null);
  const [aisleBoxes, setAisleBoxes] = useState<PlacedAisleBox[]>([]);
  const [cameraBounds, setCameraBounds] = useState<AisleCameraBounds>({
    minZ: -8,
    maxZ: 1.8,
    defaultZ: 1.2,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadShelfData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const db = getDatabase();

      // Query owned collection items joined with games and box_dimensions
      const rows = await db
        .select({
          bggId: games.bggId,
          title: games.title,
          thumbnailUrl: games.thumbnailUrl,
          localThumbnailUri: games.localThumbnailUri,
          widthCm: boxDimensions.widthCm,
          heightCm: boxDimensions.heightCm,
          depthCm: boxDimensions.depthCm,
          isEstimated: boxDimensions.isEstimated,
        })
        .from(collectionItems)
        .innerJoin(games, eq(collectionItems.bggId, games.bggId))
        .leftJoin(boxDimensions, eq(games.bggId, boxDimensions.bggId))
        .where(eq(collectionItems.statusOwn, 1));

      const gameSources: GameDimensionsSource[] = rows.map((r) => ({
        bggId: r.bggId,
        title: r.title,
        widthCm: r.widthCm ?? 29.7,
        heightCm: r.heightCm ?? 29.7,
        depthCm: r.depthCm ?? 7.1,
        isEstimated: r.isEstimated === 1 || r.widthCm === null,
        thumbnailUri: r.localThumbnailUri || r.thumbnailUrl,
      }));

      const layout = shelfLayoutEngine.calculateLayout(gameSources);
      const aisleLayout = shelfLayoutEngine.calculateAisleLayout(gameSources);

      setShelf(layout.shelf);
      setBoxes(layout.boxes);
      setAisle(aisleLayout.aisle);
      setAisleBoxes(aisleLayout.boxes);
      setCameraBounds(aisleLayout.cameraBounds);
    } catch (err) {
      console.error('Failed to load shelf collection from SQLite:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShelfData();
  }, [loadShelfData]);

  return {
    boxes,
    shelf,
    aisle,
    aisleBoxes,
    cameraBounds,
    loading,
    error,
    refresh: loadShelfData,
  };
}
