# Data Model: Pre-populated Sleeves & Brazilian Portuguese Rulebooks

## Entities & Schemas

### 1. `CommunityGameSleeveData` (Catalog Entity)

Defined in `src/data/community-sleeves-catalog.ts`.

| Field | Type | Description |
|---|---|---|
| `bggId` | `number` | Unique BoardGameGeek game identifier |
| `gameTitle` | `string` | Canonical name of the board game |
| `cards` | `CatalogCardSet[]` | List of distinct card sets (empty for tile/wooden games) |

#### `CatalogCardSet`
| Field | Type | Description |
|---|---|---|
| `cardSetName` | `string` | Descriptive label (e.g., "Baralho Principal", "Cartas de Objetivo") |
| `formatName` | `string` | Standard format name (e.g., "Standard Card Game", "Mini European") |
| `widthMm` | `number` | Card width in millimeters (e.g., 63.5, 44, 57) |
| `heightMm` | `number` | Card height in millimeters (e.g., 88, 68, 87) |
| `cardCount` | `number` | Exact number of cards in this set |

---

### 2. `BundledRulebookManifest` (Bundled Asset Entity)

Defined in `src/data/bundled-rulebooks-catalog.ts`.

| Field | Type | Description |
|---|---|---|
| `bggId` | `number` | Game identifier |
| `gameTitle` | `string` | Game title |
| `label` | `string` | Display label, e.g., "Manual em Português (PT-BR)" |
| `language` | `'pt-BR'` | Language code |
| `assetPath` | `string` | Relative path in repository, e.g. `assets/rulebooks/catan-ptbr.pdf` |
| `fileSizeBytes` | `number` | Exact byte size of the PDF file |
| `md5` | `string` | Content hash for integrity and deduplication |
| `pageCount` | `number` | Page count of the PDF document |

---

### 3. Database Persistence Mapping

Existing SQLite schema tables in `src/db/schema.ts` reused without schema modifications:

- **`game_sleeves`**:
  - `id`: Integer primary key (auto-increment)
  - `bgg_id`: Integer foreign key -> `games.bgg_id`
  - `card_set_name`: Text
  - `format_name`: Text
  - `width_mm`: Real
  - `height_mm`: Real
  - `card_count`: Integer
  - `is_custom`: Integer (0 for auto-seeded community catalog records, 1 for user customizations)
  - `created_at`: Integer timestamp
  - `updated_at`: Integer timestamp

- **`rulebooks`**:
  - `id`: Integer primary key (auto-increment)
  - `bgg_id`: Integer foreign key -> `games.bgg_id`
  - `label`: Text ("Manual em Português (PT-BR)")
  - `doc_type`: Text ("BASE_RULES")
  - `source_kind`: Text ("BUNDLED_ASSET")
  - `relative_path`: Text unique path
  - `file_size_bytes`: Integer
  - `md5`: Text
  - `status`: Text ("READY")
  - `last_viewed_page`: Integer default 1
  - `created_at`: Integer timestamp
  - `updated_at`: Integer timestamp
