import { BggCollectionItemRaw } from '@/api/contracts';

describe('Local Enrichment Preservation Logic', () => {
  interface LocalRecord {
    collId: number;
    bggRating: number | null;
    localNotes: string | null;
    customTags: string[] | null;
  }

  function simulateReconciliation(
    existingLocal: LocalRecord,
    incomingBgg: BggCollectionItemRaw
  ): LocalRecord {
    return {
      collId: existingLocal.collId,
      // BGG fields are updated
      bggRating: incomingBgg.stats?.rating ?? null,
      // Local enrichments are strictly preserved
      localNotes: existingLocal.localNotes,
      customTags: existingLocal.customTags,
    };
  }

  it('updates remote rating while preserving user local notes and custom tags', () => {
    const existing: LocalRecord = {
      collId: 999,
      bggRating: 7.0,
      localNotes: 'Sleeved with Mayday Premium 63.5x88. Missing 1 wooden cube.',
      customTags: ['favorite', 'euro', 'trading'],
    };

    const incomingBgg: BggCollectionItemRaw = {
      objectid: 13,
      collid: 999,
      name: 'Catan',
      stats: {
        rating: 9.0, // Rating updated on BGG from 7.0 to 9.0
      },
      status: {
        own: true,
        prevowned: false,
        fortrade: false,
        want: false,
        wanttobuy: false,
        wishlist: false,
      },
    };

    const reconciled = simulateReconciliation(existing, incomingBgg);

    expect(reconciled.bggRating).toBe(9.0);
    expect(reconciled.localNotes).toBe('Sleeved with Mayday Premium 63.5x88. Missing 1 wooden cube.');
    expect(reconciled.customTags).toEqual(['favorite', 'euro', 'trading']);
  });
});

