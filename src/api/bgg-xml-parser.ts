import { XMLParser } from 'fast-xml-parser';
import { BggCollectionItemRaw, BggThingVersionRaw } from './contracts';
import { BggParseError } from './types';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  trimValues: true,
  isArray: (name) => name === 'item',
});

interface RawXmlItem {
  '@_objectid': number | string;
  '@_collid': number | string;
  name?: string | { '#text': string };
  yearpublished?: number | string;
  image?: string;
  thumbnail?: string;
  stats?: {
    '@_minplayers'?: number | string;
    '@_maxplayers'?: number | string;
    '@_minplaytime'?: number | string;
    '@_maxplaytime'?: number | string;
    '@_playingtime'?: number | string;
    rating?: {
      '@_value'?: number | string;
    };
  };
  status?: {
    '@_own'?: number | string;
    '@_prevowned'?: number | string;
    '@_fortrade'?: number | string;
    '@_want'?: number | string;
    '@_wanttobuy'?: number | string;
    '@_wishlist'?: number | string;
    '@_played'?: number | string;
  };
  comment?: string;
}

/**
 * Parses BGG Collection XMLAPI2 response string into typed BggCollectionItemRaw objects.
 */
export function parseBggCollectionXml(xmlString: string): BggCollectionItemRaw[] {
  if (!xmlString || typeof xmlString !== 'string' || !xmlString.includes('<items')) {
    throw new BggParseError('Invalid or missing XML payload from BGG API');
  }

  let parsed: { items?: { item?: RawXmlItem[] } };
  try {
    parsed = xmlParser.parse(xmlString);
  } catch (err) {
    throw new BggParseError('Failed to parse BGG XML: ' + (err instanceof Error ? err.message : String(err)), err);
  }

  if (!parsed || !parsed.items) {
    throw new BggParseError('Missing <items> root element in BGG XML response');
  }

  const rawItems = parsed.items.item;
  if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
    return [];
  }

  return rawItems.map((item): BggCollectionItemRaw => {
    const objectId = Number(item['@_objectid']);
    const collId = Number(item['@_collid']);

    let name = '';
    if (typeof item.name === 'string') {
      name = item.name;
    } else if (item.name && typeof item.name === 'object' && '#text' in item.name) {
      name = item.name['#text'];
    }

    const yearPublished = item.yearpublished ? Number(item.yearpublished) : undefined;

    let rating: number | undefined;
    const rawRating = item.stats?.rating?.['@_value'];
    if (rawRating !== undefined && rawRating !== null && rawRating !== 'N/A') {
      const num = Number(rawRating);
      if (!isNaN(num)) {
        rating = num;
      }
    }

    const stats = item.stats
      ? {
          minplayers: item.stats['@_minplayers'] ? Number(item.stats['@_minplayers']) : undefined,
          maxplayers: item.stats['@_maxplayers'] ? Number(item.stats['@_maxplayers']) : undefined,
          minplaytime: item.stats['@_minplaytime'] ? Number(item.stats['@_minplaytime']) : undefined,
          maxplaytime: item.stats['@_maxplaytime'] ? Number(item.stats['@_maxplaytime']) : undefined,
          playingtime: item.stats['@_playingtime'] ? Number(item.stats['@_playingtime']) : undefined,
          rating,
        }
      : undefined;

    const statusObj = item.status || {};
    const status = {
      own: statusObj['@_own'] === 1 || statusObj['@_own'] === '1',
      prevowned: statusObj['@_prevowned'] === 1 || statusObj['@_prevowned'] === '1',
      fortrade: statusObj['@_fortrade'] === 1 || statusObj['@_fortrade'] === '1',
      want: statusObj['@_want'] === 1 || statusObj['@_want'] === '1',
      wanttobuy: statusObj['@_wanttobuy'] === 1 || statusObj['@_wanttobuy'] === '1',
      wishlist: statusObj['@_wishlist'] === 1 || statusObj['@_wishlist'] === '1',
      played: statusObj['@_played'] === 1 || statusObj['@_played'] === '1',
    };

    return {
      objectid: objectId,
      collid: collId,
      name,
      yearpublished: yearPublished,
      image: item.image,
      thumbnail: item.thumbnail,
      stats,
      status,
      comment: typeof item.comment === 'string' ? item.comment : undefined,
    };
  });
}

interface RawThingItem {
  '@_id': number | string;
  '@_type': string;
  name?: { '@_value'?: string } | Array<{ '@_value'?: string }>;
  versions?: {
    item?: Array<{
      '@_id': number | string;
      '@_type': string;
      name?: { '@_value'?: string } | Array<{ '@_value'?: string }>;
      width?: { '@_value'?: number | string };
      length?: { '@_value'?: number | string };
      depth?: { '@_value'?: number | string };
      weight?: { '@_value'?: number | string };
    }>;
  };
}

/**
 * Parses BGG /thing?versions=1 XML response into a Map of bggId -> BggThingVersionRaw[].
 * Converts measurements from inches to centimeters and pounds to kilograms.
 */
export function parseBggThingVersionsXml(xmlString: string): Map<number, BggThingVersionRaw[]> {
  const result = new Map<number, BggThingVersionRaw[]>();
  if (!xmlString || !xmlString.includes('<items')) {
    return result;
  }

  let parsed: { items?: { item?: RawThingItem[] } };
  try {
    parsed = xmlParser.parse(xmlString);
  } catch (err) {
    throw new BggParseError('Failed to parse Thing versions XML: ' + (err instanceof Error ? err.message : String(err)));
  }

  const rawThings = parsed.items?.item;
  if (!rawThings || !Array.isArray(rawThings)) {
    return result;
  }

  for (const thing of rawThings) {
    const bggId = Number(thing['@_id']);
    const versionsList: BggThingVersionRaw[] = [];

    const rawVersions = thing.versions?.item;
    if (rawVersions && Array.isArray(rawVersions)) {
      for (const v of rawVersions) {
        const vId = Number(v['@_id']);
        let vName: string | undefined;
        if (v.name) {
          if (Array.isArray(v.name)) {
            vName = v.name[0]?.['@_value'];
          } else {
            vName = v.name['@_value'];
          }
        }

        const rawWidth = Number(v.width?.['@_value']);
        const rawLength = Number(v.length?.['@_value']);
        const rawDepth = Number(v.depth?.['@_value']);
        const rawWeight = Number(v.weight?.['@_value']);

        // Convert inches to cm (1 inch = 2.54 cm)
        const widthCm = rawWidth > 0 ? rawWidth * 2.54 : undefined;
        const heightCm = rawLength > 0 ? rawLength * 2.54 : undefined;
        const depthCm = rawDepth > 0 ? rawDepth * 2.54 : undefined;
        // Convert lbs to kg (1 lb = 0.453592 kg)
        const weightKg = rawWeight > 0 ? rawWeight * 0.453592 : undefined;

        versionsList.push({
          versionId: vId,
          versionName: vName,
          widthCm,
          heightCm,
          depthCm,
          weightKg,
        });
      }
    }

    result.set(bggId, versionsList);
  }

  return result;
}
