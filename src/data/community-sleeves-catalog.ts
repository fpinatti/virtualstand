export interface CatalogCardSet {
  cardSetName: string;
  formatName: string;
  widthMm: number;
  heightMm: number;
  cardCount: number;
}

export interface CommunityGameSleeveData {
  bggId: number;
  gameTitle: string;
  cards: CatalogCardSet[];
}

/**
 * Normalizes sleeve dimensions into a standard lookup key (e.g. "64x88").
 * Uses nearest millimeter rounding to bridge manufacturer labeling variations (63.5x88 -> 64x88).
 */
export function getNormalizedDimensionKey(widthMm: number, heightMm: number): string {
  const w = Math.round(widthMm);
  const h = Math.round(heightMm);
  return `${w}x${h}`;
}

export const COMMUNITY_SLEEVE_CATALOG: CommunityGameSleeveData[] = [
  {
    bggId: 13,
    gameTitle: 'Catan',
    cards: [
      {
        cardSetName: 'Cartas de Recursos e Desenvolvimento',
        formatName: 'Catan Size (54x80mm)',
        widthMm: 54,
        heightMm: 80,
        cardCount: 120,
      },
    ],
  },
  {
    bggId: 822,
    gameTitle: 'Carcassonne',
    cards: [], // Tile game - 0 cards
  },
  {
    bggId: 30549,
    gameTitle: 'Pandemic',
    cards: [
      {
        cardSetName: 'Cartas de Jogador, Infecção e Funções',
        formatName: 'Standard Card Game',
        widthMm: 63.5,
        heightMm: 88,
        cardCount: 118,
      },
    ],
  },
  {
    bggId: 68448,
    gameTitle: '7 Wonders',
    cards: [
      {
        cardSetName: 'Cartas de Eras e Líderes',
        formatName: '7 Wonders / Magnum',
        widthMm: 65,
        heightMm: 100,
        cardCount: 157,
      },
    ],
  },
  {
    bggId: 266192,
    gameTitle: 'Wingspan',
    cards: [
      {
        cardSetName: 'Cartas de Aves e Bônus',
        formatName: 'Standard American',
        widthMm: 57,
        heightMm: 87,
        cardCount: 212,
      },
    ],
  },
  {
    bggId: 9209,
    gameTitle: 'Ticket to Ride',
    cards: [
      {
        cardSetName: 'Vagões e Bilhetes de Destino',
        formatName: 'Mini USA / Small',
        widthMm: 44,
        heightMm: 68,
        cardCount: 144,
      },
    ],
  },
  {
    bggId: 167791,
    gameTitle: 'Terraforming Mars',
    cards: [
      {
        cardSetName: 'Projetos e Corporações',
        formatName: 'Standard Card Game',
        widthMm: 63.5,
        heightMm: 88,
        cardCount: 208,
      },
    ],
  },
  {
    bggId: 172225,
    gameTitle: 'Exploding Kittens',
    cards: [
      {
        cardSetName: 'Baralho Completo',
        formatName: 'Standard Card Game',
        widthMm: 63.5,
        heightMm: 88,
        cardCount: 56,
      },
    ],
  },
  {
    bggId: 131357,
    gameTitle: 'Coup',
    cards: [
      {
        cardSetName: 'Personagens e Ações',
        formatName: '7 Wonders / Magnum',
        widthMm: 65,
        heightMm: 100,
        cardCount: 15,
      },
    ],
  },
  {
    bggId: 169786,
    gameTitle: 'Scythe',
    cards: [
      {
        cardSetName: 'Cartas de Combate e Objetivos',
        formatName: 'Mini European',
        widthMm: 44,
        heightMm: 68,
        cardCount: 44,
      },
      {
        cardSetName: 'Cartas de Fábrica e Encontros',
        formatName: 'Standard American',
        widthMm: 57,
        heightMm: 87,
        cardCount: 54,
      },
      {
        cardSetName: 'Cartas de Ajuda e Bônus',
        formatName: 'Tarot / Large',
        widthMm: 70,
        heightMm: 110,
        cardCount: 42,
      },
    ],
  },
  {
    bggId: 230802,
    gameTitle: 'Azul',
    cards: [], // Tile placement - 0 cards
  },
];

const catalogMap = new Map<number, CommunityGameSleeveData>();
COMMUNITY_SLEEVE_CATALOG.forEach((item) => catalogMap.set(item.bggId, item));

/**
 * Retrieves pre-populated sleeve data for a given BGG ID.
 */
export function findCommunitySleevesByBggId(bggId: number): CommunityGameSleeveData | null {
  return catalogMap.get(bggId) ?? null;
}

