# Data Model: AI-Assisted Rulebook Acquisition & Auto-Download Sync

**Feature**: `013-ai-rulebook-download-sync`
**Date**: 2026-11-17

## Entities & Schemas

### 1. Rulebook Asset (Physical Filesystem)

Represents an authentic PDF rulebook stored physically on the host filesystem.

- **Path**: `assets/rulebooks/${slug}-regras-ptbr.pdf`
- **Slug Format**: Lowercase ASCII kebab-case (e.g., `heat-pedal-to-the-metal-regras-ptbr.pdf`)
- **Header**: Binary stream beginning with `%PDF-`
- **Integrity**: MD5 hash computed from file contents

---

### 2. SQLite Database Schema (`rulebooks` Table)

Stores the local registration and operational status of each rulebook.

```sql
CREATE TABLE IF NOT EXISTS rulebooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bgg_id INTEGER NOT NULL REFERENCES games(bgg_id),
  label TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'BASE_RULES', -- 'BASE_RULES' | 'EXPANSION' | 'FAQ' | 'QUICK_REF'
  source_kind TEXT NOT NULL DEFAULT 'BUNDLED_ASSET', -- 'BUNDLED_ASSET' | 'DOWNLOADED' | 'USER_ATTACHED'
  source_url TEXT,
  relative_path TEXT NOT NULL, -- e.g. 'assets/rulebooks/harmonies-regras-ptbr.pdf'
  file_size_bytes INTEGER NOT NULL,
  md5 TEXT,
  page_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'READY', -- 'READY' | 'DOWNLOADING' | 'ERROR'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rulebooks_bgg_id ON rulebooks(bgg_id);
```

---

### 3. Physical Versioned Catalog Schema (`virtualstand-catalog.json`)

The single-source-of-truth JSON file persisted in `assets/data/virtualstand-catalog.json` for Git versioning and mobile startup seeding.

```typescript
export interface VirtualStandCatalog {
  version: number;
  exportedAt: string;
  totalGames: number;
  games: CatalogGameItem[];
}

export interface CatalogGameItem {
  bggId: number;
  title: string;
  yearPublished: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  localThumbnailUri: string | null;
  localImageUri: string | null;
  dimensions: CatalogDimensions | null;
  sleeves: CatalogSleeveItem[];
  rulebooks: CatalogRulebookItem[];
  personalRating: number | null;
  statusOwn: number;
}

export interface CatalogRulebookItem {
  label: string;
  docType: string;
  sourceKind: string;
  sourceUrl?: string | null;
  relativePath: string;
  fileSizeBytes: number;
  md5?: string | null;
  pageCount: number;
  status: string;
}
```

---

### 4. API Request & Response Contracts (`POST /api/find-rulebook`)

```typescript
export interface FindRulebookRequest {
  bggId: number;
  title: string;
}

export interface FindRulebookResponse {
  success: boolean;
  bggId: number;
  fileName?: string;
  relativePath?: string;
  fileSizeBytes?: number;
  message?: string;
  error?: string;
}
```
