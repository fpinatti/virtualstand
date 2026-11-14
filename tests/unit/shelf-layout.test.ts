import { ShelfLayoutEngine } from '@/services/shelf-layout.service';
import { GameDimensionsSource } from '@/components/shelf-3d/types';

describe('ShelfLayoutEngine (Spatial Packing Math)', () => {
  const engine = new ShelfLayoutEngine();

  it('converts centimeter dimensions to Three.js scene units (1 unit = 10cm)', () => {
    const games: GameDimensionsSource[] = [
      {
        bggId: 13,
        title: 'Catan',
        widthCm: 29.7,
        heightCm: 29.7,
        depthCm: 7.1,
        isEstimated: false,
      },
    ];

    const { boxes } = engine.calculateLayout(games);

    expect(boxes).toHaveLength(1);
    const box = boxes[0];
    // Box dimensions in scene units: [depth/thickness, height, width]
    expect(box.size[0]).toBeCloseTo(0.71, 2); // spine width on shelf = depthCm / 10
    expect(box.size[1]).toBeCloseTo(2.97, 2); // height = heightCm / 10
    expect(box.size[2]).toBeCloseTo(2.97, 2); // depth inside cubby = widthCm / 10
  });

  it('packs multiple boxes into the same cubby while space permits', () => {
    const games: GameDimensionsSource[] = [
      {
        bggId: 1,
        title: 'Game 1',
        widthCm: 30,
        heightCm: 30,
        depthCm: 7, // 0.7 units
        isEstimated: false,
      },
      {
        bggId: 2,
        title: 'Game 2',
        widthCm: 30,
        heightCm: 30,
        depthCm: 7, // 0.7 units
        isEstimated: false,
      },
      {
        bggId: 3,
        title: 'Game 3',
        widthCm: 30,
        heightCm: 30,
        depthCm: 7, // 0.7 units
        isEstimated: false,
      },
    ];

    const { boxes } = engine.calculateLayout(games);

    expect(boxes).toHaveLength(3);
    // All 3 games (3 * 0.7 = 2.1 <= 3.35) fit in cubby 0
    expect(boxes[0].cubbyIndex).toBe(0);
    expect(boxes[1].cubbyIndex).toBe(0);
    expect(boxes[2].cubbyIndex).toBe(0);

    // X positions must be ordered from left to right inside the cubby
    expect(boxes[0].position[0]).toBeLessThan(boxes[1].position[0]);
    expect(boxes[1].position[0]).toBeLessThan(boxes[2].position[0]);
  });

  it('overflows into subsequent cubbies when cubby width bound is exceeded', () => {
    // 5 games of depth 0.7 units = 3.5 units > 3.35 cubby width
    const games: GameDimensionsSource[] = Array.from({ length: 6 }, (_, i) => ({
      bggId: i + 1,
      title: `Game ${i + 1}`,
      widthCm: 30,
      heightCm: 30,
      depthCm: 8, // 0.8 units -> 4 * 0.8 = 3.2 <= 3.35, 5th overflows
      isEstimated: false,
    }));

    const { boxes, shelf } = engine.calculateLayout(games);

    expect(boxes[0].cubbyIndex).toBe(0);
    expect(boxes[3].cubbyIndex).toBe(0);
    expect(boxes[4].cubbyIndex).toBe(1); // 5th game overflows to cubby 1
    expect(boxes[5].cubbyIndex).toBe(1); // 6th game in cubby 1

    expect(shelf.cols * shelf.rows).toBeGreaterThanOrEqual(2);
  });

  it('calculates extracted position pulled forward along Z-axis', () => {
    const games: GameDimensionsSource[] = [
      {
        bggId: 13,
        title: 'Catan',
        widthCm: 29.7,
        heightCm: 29.7,
        depthCm: 7.1,
        isEstimated: false,
      },
    ];

    const { boxes } = engine.calculateLayout(games);
    const box = boxes[0];

    // Extracted position must pull forward along +Z by ~1.8 units
    expect(box.extractedPosition[2]).toBeGreaterThan(box.position[2] + 1.0);
  });
});

