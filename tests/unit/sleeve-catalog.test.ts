import {
  findCommunitySleevesByBggId,
  getNormalizedDimensionKey,
} from '@/data/community-sleeves-catalog';

describe('Community Sleeve Catalog Dataset', () => {
  it('finds verified sleeve specifications for popular board games', () => {
    // Catan (BGG ID 13)
    const catanSleeves = findCommunitySleevesByBggId(13);
    expect(catanSleeves).not.toBeNull();
    expect(catanSleeves?.cards).toHaveLength(1);
    expect(catanSleeves?.cards[0].widthMm).toBe(54);
    expect(catanSleeves?.cards[0].heightMm).toBe(80);
    expect(catanSleeves?.cards[0].cardCount).toBe(120);

    // Pandemic (BGG ID 30549)
    const pandemicSleeves = findCommunitySleevesByBggId(30549);
    expect(pandemicSleeves).not.toBeNull();
    expect(pandemicSleeves?.cards[0].formatName).toBe('Standard Card Game');
    expect(pandemicSleeves?.cards[0].cardCount).toBe(118);

    // Carcassonne (BGG ID 822) - tile game, 0 cards
    const carcSleeves = findCommunitySleevesByBggId(822);
    expect(carcSleeves).not.toBeNull();
    expect(carcSleeves?.cards).toHaveLength(0);
  });

  it('returns null for unknown games not present in catalog', () => {
    expect(findCommunitySleevesByBggId(9999999)).toBeNull();
  });

  it('normalizes dimension keys correctly with rounding tolerance', () => {
    expect(getNormalizedDimensionKey(63.5, 88.0)).toBe('64x88');
    expect(getNormalizedDimensionKey(63.8, 88.2)).toBe('64x88');
    expect(getNormalizedDimensionKey(44.0, 68.0)).toBe('44x68');
  });
});

