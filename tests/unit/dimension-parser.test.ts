import { parseBggThingVersionsXml } from '@/api/bgg-xml-parser';

describe('BGG Thing Versions XML Parser', () => {
  it('parses boardgameversion items with dimensions accurately', () => {
    const xml = `
      <items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
        <item type="boardgame" id="13">
          <name type="primary" sortindex="1" value="Catan" />
          <versions>
            <item type="boardgameversion" id="240500">
              <name type="primary" sortindex="1" value="English fifth edition (2015)" />
              <width value="11.6" />
              <length value="11.6" />
              <depth value="2.8" />
              <weight value="2.4" />
            </item>
          </versions>
        </item>
        <item type="boardgame" id="822">
          <name type="primary" sortindex="1" value="Carcassonne" />
          <versions>
            <item type="boardgameversion" id="3000">
              <name type="primary" sortindex="1" value="German first edition" />
              <width value="7.5" />
              <length value="10.8" />
              <depth value="2.6" />
              <weight value="1.8" />
            </item>
          </versions>
        </item>
      </items>
    `;

    const resultMap = parseBggThingVersionsXml(xml);

    expect(resultMap.has(13)).toBe(true);
    const catanVersions = resultMap.get(13)!;
    expect(catanVersions).toHaveLength(1);
    expect(catanVersions[0].versionId).toBe(240500);
    expect(catanVersions[0].versionName).toBe('English fifth edition (2015)');
    expect(catanVersions[0].widthCm).toBeCloseTo(11.6 * 2.54, 1);
    expect(catanVersions[0].heightCm).toBeCloseTo(11.6 * 2.54, 1);
    expect(catanVersions[0].depthCm).toBeCloseTo(2.8 * 2.54, 1);

    expect(resultMap.has(822)).toBe(true);
  });
});

