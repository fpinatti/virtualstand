import { parseBggCollectionXml } from '@/api/bgg-xml-parser';
import { BggParseError } from '@/api/types';

describe('BGG Collection XML Parser', () => {
  it('parses a multi-game collection XML payload accurately', () => {
    const xml = `
      <items totalitems="2" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse" pubdate="Sat, 14 Nov 2026 13:00:00 +0000">
        <item objecttype="thing" objectid="13" subtype="boardgame" collid="101">
          <name sortindex="1">Catan</name>
          <yearpublished>1995</yearpublished>
          <image>https://cf.geekdo-images.com/catan.jpg</image>
          <thumbnail>https://cf.geekdo-images.com/catan_t.jpg</thumbnail>
          <stats minplayers="3" maxplayers="4" minplaytime="60" maxplaytime="120" playingtime="90" numowned="200000">
            <rating value="8.5">
              <usersrated value="120000" />
            </rating>
          </stats>
          <status own="1" prevowned="0" fortrade="0" want="0" wanttobuy="0" wishlist="0" lastmodified="2026-11-14 10:00:00" />
          <comment>Classic gateway game</comment>
        </item>
        <item objecttype="thing" objectid="822" subtype="boardgame" collid="102">
          <name sortindex="1">Carcassonne</name>
          <yearpublished>2000</yearpublished>
          <image>https://cf.geekdo-images.com/carc.jpg</image>
          <thumbnail>https://cf.geekdo-images.com/carc_t.jpg</thumbnail>
          <stats minplayers="2" maxplayers="5" minplaytime="35" maxplaytime="45" playingtime="40" numowned="180000">
            <rating value="N/A">
              <usersrated value="95000" />
            </rating>
          </stats>
          <status own="1" prevowned="0" fortrade="0" want="0" wanttobuy="0" wishlist="1" lastmodified="2026-11-14 11:00:00" />
        </item>
      </items>
    `;

    const items = parseBggCollectionXml(xml);

    expect(items).toHaveLength(2);

    // Catan assertions
    expect(items[0]).toEqual({
      objectid: 13,
      collid: 101,
      name: 'Catan',
      yearpublished: 1995,
      image: 'https://cf.geekdo-images.com/catan.jpg',
      thumbnail: 'https://cf.geekdo-images.com/catan_t.jpg',
      stats: {
        minplayers: 3,
        maxplayers: 4,
        minplaytime: 60,
        maxplaytime: 120,
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
        played: false,
      },
      comment: 'Classic gateway game',
    });

    // Carcassonne assertions (unrated: value="N/A", no comment)
    expect(items[1].objectid).toBe(822);
    expect(items[1].collid).toBe(102);
    expect(items[1].name).toBe('Carcassonne');
    expect(items[1].stats?.rating).toBeUndefined();
    expect(items[1].status.wishlist).toBe(true);
    expect(items[1].comment).toBeUndefined();
  });

  it('parses empty collection payload returning empty array', () => {
    const xml = `<items totalitems="0"></items>`;
    const items = parseBggCollectionXml(xml);
    expect(items).toEqual([]);
  });

  it('handles single-item payload where XML parser creates an object instead of array', () => {
    const xml = `
      <items totalitems="1">
        <item objecttype="thing" objectid="30549" subtype="boardgame" collid="201">
          <name>Pandemic</name>
          <yearpublished>2008</yearpublished>
          <stats minplayers="2" maxplayers="4" minplaytime="45" maxplaytime="45" playingtime="45">
            <rating value="8.0" />
          </stats>
          <status own="1" prevowned="0" fortrade="0" want="0" wanttobuy="0" wishlist="0" />
        </item>
      </items>
    `;

    const items = parseBggCollectionXml(xml);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Pandemic');
    expect(items[0].objectid).toBe(30549);
    expect(items[0].collid).toBe(201);
  });

  it('throws BggParseError when XML is malformed or invalid', () => {
    const invalidXml = `This is not XML at all <broken`;
    expect(() => parseBggCollectionXml(invalidXml)).toThrow(BggParseError);
  });
});
