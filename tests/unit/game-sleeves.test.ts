import { GameSleeveItem } from '@/services/sleeve-types';

describe('Game Sleeve Multi-Size Requirements', () => {
  it('supports multiple card sets with independent sleeve specifications', () => {
    const scytheDecks: GameSleeveItem[] = [
      {
        bggId: 169786,
        cardSetName: 'Mini European Decks',
        formatName: 'Mini European',
        widthMm: 44,
        heightMm: 68,
        cardCount: 44,
        isSleeved: false,
      },
      {
        bggId: 169786,
        cardSetName: 'Standard American Encounters',
        formatName: 'Standard American',
        widthMm: 57,
        heightMm: 87,
        cardCount: 54,
        isSleeved: true,
      },
      {
        bggId: 169786,
        cardSetName: 'Large Tarot Prompts',
        formatName: 'Tarot',
        widthMm: 70,
        heightMm: 110,
        cardCount: 42,
        isSleeved: false,
      },
    ];

    expect(scytheDecks).toHaveLength(3);
    const totalCards = scytheDecks.reduce((sum, d) => sum + d.cardCount, 0);
    expect(totalCards).toBe(140);

    const pendingDecks = scytheDecks.filter((d) => !d.isSleeved);
    expect(pendingDecks).toHaveLength(2);
  });
});

