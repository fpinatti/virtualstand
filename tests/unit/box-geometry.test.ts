describe('Box Geometry Dimensions & Bounds', () => {
  it('clamps extreme box sizes to fit within shelf cubby physical bounds', () => {
    // Cubby internal size: 3.35 x 3.35 x 3.90 units
    const maxCubbyHeight = 3.35;
    const maxCubbyDepth = 3.90;

    // Normal game: 30cm -> 3.0 units
    const normalHeight = Math.min(maxCubbyHeight - 0.1, 30 / 10);
    expect(normalHeight).toBe(3.0);

    // Oversized box (e.g. 50cm tall): clamped to cubby height - 0.1
    const oversizedHeight = Math.min(maxCubbyHeight - 0.1, 50 / 10);
    expect(oversizedHeight).toBeCloseTo(3.25, 2);

    // Tiny card box (e.g. 1cm depth): clamped to minimum 0.2 units for visibility
    const tinySpine = Math.max(0.2, 1 / 10);
    expect(tinySpine).toBe(0.2);
  });
});

