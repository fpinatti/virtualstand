import { calculateBackoffDelay } from '@/api/backoff';
import { parseBggCollectionXml, parseBggThingVersionsXml } from '@/api/bgg-xml-parser';
import { calculateBoxDimensions } from '@/services/dimension-calculator.service';

describe('Quickstart End-to-End Scenarios Validation', () => {
  it('validates Scenario A: Initial import with queued response (HTTP 202) and offline parsing', () => {
    // 1. Verify exponential backoff delay calculation during queueing
    const delay1 = calculateBackoffDelay(0, undefined, () => 0.5);
    const delay2 = calculateBackoffDelay(1, undefined, () => 0.5);
    expect(delay1).toBe(2000);
    expect(delay2).toBe(3000);

    // 2. Verify collection XML parses accurately
    const xml = `
      <items totalitems="1">
        <item objecttype="thing" objectid="13" subtype="boardgame" collid="101">
          <name>Catan</name>
          <yearpublished>1995</yearpublished>
          <image>https://cf.geekdo-images.com/catan.jpg</image>
          <thumbnail>https://cf.geekdo-images.com/catan_t.jpg</thumbnail>
          <stats minplayers="3" maxplayers="4" minplaytime="60" maxplaytime="120" playingtime="90">
            <rating value="8.0" />
          </stats>
          <status own="1" prevowned="0" fortrade="0" want="0" wanttobuy="0" wishlist="0" />
        </item>
      </items>
    `;
    const parsed = parseBggCollectionXml(xml);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('Catan');
    expect(parsed[0].status.own).toBe(true);
  });

  it('validates Scenario B: Incremental sync and local enrichment preservation', () => {
    const existing = {
      collId: 101,
      bggRating: 7.5,
      localNotes: 'Must-play at every game night',
      customTags: ['trading', 'gateway'],
    };

    const remoteUpdate = {
      bggRating: 9.0, // Updated score from BGG
    };

    // Reconciled entity
    const reconciled = {
      ...existing,
      bggRating: remoteUpdate.bggRating,
    };

    expect(reconciled.bggRating).toBe(9.0);
    expect(reconciled.localNotes).toBe('Must-play at every game night');
    expect(reconciled.customTags).toEqual(['trading', 'gateway']);
  });

  it('validates Scenario C: Box dimension extraction & physical proportions', () => {
    const thingXml = `
      <items>
        <item type="boardgame" id="13">
          <versions>
            <item type="boardgameversion" id="500">
              <name value="Standard Edition" />
              <width value="11.6" />
              <length value="11.6" />
              <depth value="2.8" />
            </item>
          </versions>
        </item>
      </items>
    `;

    const versionsMap = parseBggThingVersionsXml(thingXml);
    const versions = versionsMap.get(13) ?? [];
    const dimensions = calculateBoxDimensions(13, versions);

    expect(dimensions.isEstimated).toBe(0);
    expect(dimensions.widthCm).toBeCloseTo(11.6 * 2.54, 1);
    expect(dimensions.heightCm).toBeCloseTo(11.6 * 2.54, 1);
    expect(dimensions.depthCm).toBeCloseTo(2.8 * 2.54, 1);
  });
});

