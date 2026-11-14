import { BggCollectionItemRaw } from '@/api/contracts';

describe('Incremental Sync Diffing', () => {
  it('identifies new additions and updated items correctly', () => {
    const existingCollIds = new Set([101, 102]);

    const incomingBatch: BggCollectionItemRaw[] = [
      {
        objectid: 13,
        collid: 101,
        name: 'Catan',
        stats: { rating: 8.5 },
        status: { own: true, prevowned: false, fortrade: false, want: false, wanttobuy: false, wishlist: false },
      },
      {
        objectid: 9209,
        collid: 103, // New game added on BGG
        name: 'Ticket to Ride',
        stats: { rating: 8.0 },
        status: { own: true, prevowned: false, fortrade: false, want: false, wanttobuy: false, wishlist: false },
      },
    ];

    const additions = incomingBatch.filter((item) => !existingCollIds.has(item.collid));
    const updates = incomingBatch.filter((item) => existingCollIds.has(item.collid));

    expect(additions).toHaveLength(1);
    expect(additions[0].name).toBe('Ticket to Ride');

    expect(updates).toHaveLength(1);
    expect(updates[0].name).toBe('Catan');
  });
});

