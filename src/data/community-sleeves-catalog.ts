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
  {
    bggId: 346965,
    gameTitle: "Azul: Queen's Garden",
    cards: [], // Tile placement - 0 cards
  },
  {
    bggId: 287954,
    gameTitle: 'Azul: Pavilhão de Verão (Summer Pavilion)',
    cards: [], // Tile placement - 0 cards
  },
  {
    bggId: 367220,
    gameTitle: 'Azul: Pavilhão de Verão: Mini',
    cards: [], // Tile placement - 0 cards
  },
  {
    bggId: 358661,
    gameTitle: 'Flatiron',
    cards: [
      {
        cardSetName: 'Cartas de Ação e Edifícios',
        formatName: 'Mini European',
        widthMm: 45,
        heightMm: 68,
        cardCount: 42,
      },
    ],
  },
  {
    bggId: 341935,
    gameTitle: 'Art Robbery',
    cards: [
      {
        cardSetName: 'Cartas de Roubo e Cão de Guarda',
        formatName: 'Standard Card Game',
        widthMm: 63.5,
        heightMm: 88,
        cardCount: 55,
      },
    ],
  },
  {
    bggId: 262208,
    gameTitle: 'Dungeon Drop',
    cards: [
      {
        cardSetName: 'Cartas de Herói e Missão',
        formatName: 'Standard Card Game',
        widthMm: 63.5,
        heightMm: 88,
        cardCount: 90,
      },
    ],
  },
  {
    bggId: 147020,
    gameTitle: 'Star Realms',
    cards: [
      {
        cardSetName: 'Baralho de Facções e Frotas',
        formatName: 'Standard Card Game',
        widthMm: 63.5,
        heightMm: 88,
        cardCount: 128,
      },
    ],
  },
  {
    bggId: 12692,
    gameTitle: 'Gloom: The Legendary Card Game',
    cards: [
      {
        cardSetName: 'Cartas Transparentes de Tragédia',
        formatName: 'Standard Card Game',
        widthMm: 63.5,
        heightMm: 88,
        cardCount: 110,
      },
    ],
  },
  {
    bggId: 295947,
    gameTitle: 'Cascadia',
    cards: [
      {
        cardSetName: 'Cartas de Pontuação de Vida Selvagem',
        formatName: 'Tarot / Large',
        widthMm: 70,
        heightMm: 120,
        cardCount: 25,
      },
    ],
  },
  {
    bggId: 224517,
    gameTitle: 'Brass: Birmingham',
    cards: [
      {
        cardSetName: 'Cartas de Indústria e Locais',
        formatName: 'Standard Card Game',
        widthMm: 63.5,
        heightMm: 88,
        cardCount: 76,
      },
    ],
  },
  {
    bggId: 342942,
    gameTitle: 'Ark Nova',
    cards: [
      {
        cardSetName: 'Cartas de Animais, Patrocinadores e Projetos',
        formatName: 'Standard Card Game',
        widthMm: 63.5,
        heightMm: 88,
        cardCount: 255,
      },
    ],
  },
  {
    bggId: 316554,
    gameTitle: 'Dune: Imperium',
    cards: [
      {
        cardSetName: 'Baralho de Conflito e Intriga',
        formatName: 'Mini European',
        widthMm: 44,
        heightMm: 68,
        cardCount: 58,
      },
      {
        cardSetName: 'Baralho de Império e Reserva',
        formatName: 'Standard Card Game',
        widthMm: 63.5,
        heightMm: 88,
        cardCount: 162,
      },
    ],
  },
  {
    bggId: 148228,
    gameTitle: 'Splendor',
    cards: [
      {
        cardSetName: 'Cartas de Desenvolvimento Níveis 1, 2 e 3',
        formatName: 'Standard Card Game',
        widthMm: 63.5,
        heightMm: 88,
        cardCount: 90,
      },
    ],
  },
  {
    bggId: 129622,
    gameTitle: 'Love Letter',
    cards: [
      {
        cardSetName: 'Baralho de Personagens da Corte',
        formatName: 'Standard Card Game',
        widthMm: 63.5,
        heightMm: 88,
        cardCount: 16,
      },
    ],
  },
  {
    bggId: 2655,
    gameTitle: 'Hive',
    cards: [], // Bakelite hexagonal tiles - 0 cards
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

/**
 * Returns true if a game is cataloged as having no cards (e.g. tile-placement or component games).
 */
export function isZeroCardGame(bggId: number): boolean {
  const item = catalogMap.get(bggId);
  return Boolean(item && item.cards.length === 0);
}

