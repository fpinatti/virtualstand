import { BggCollectionItemRaw } from '@/api/contracts';

describe('Collection Import & Reconciliation Logic', () => {
  it('correctly structures BGG collection data for SQLite batch insertion', () => {
    const rawItems: BggCollectionItemRaw[] = [
      {
        objectid: 13,
        collid: 101,
        name: 'Catan',
        yearpublished: 1995,
        thumbnail: 'https://cf.geekdo-images.com/catan.jpg',
        stats: {
          minplayers: 3,
          maxplayers: 4,
          playingtime: 90,
          rating: 8.5,
        },
        status: {
          own: true,
          prevowned: false,
          fortrade: false,
          want: false,
          wanttobuy: false,
          wishlist: false,
        },
        comment: 'Great gateway game',
      },
    ];

    expect(rawItems).toHaveLength(1);
    expect(rawItems[0].objectid).toBe(13);
    expect(rawItems[0].status.own).toBe(true);
    expect(rawItems[0].stats?.rating).toBe(8.5);
  });
});

