# Data Model: Card Sleeve Tracking & Inventory

**Feature**: `003-card-sleeve-manager`  
**Date**: 2026-11-14  
**Status**: Completed  

---

## 1. Entity-Relationship Overview

```mermaid
erDiagram
    GAME ||--o{ GAME_SLEEVES : "requires"
    SLEEVE_INVENTORY ||--o{ SLEEVE_SHOPPING_ITEM : "offsets"
    GAME_SLEEVES ||--o{ SLEEVE_SHOPPING_ITEM : "generates demand for"

    GAME_SLEEVES {
        int id PK "Internal primary key"
        int bgg_id FK "Reference to games(bgg_id)"
        string card_set_name "Card deck description (e.g. Action Cards)"
        string format_name "Commercial format (e.g. Standard Card Game)"
        real width_mm "Card width in millimeters"
        real height_mm "Card height in millimeters"
        int card_count "Number of cards in this set"
        int is_sleeved "Boolean (1=sleeved, 0=pending)"
        datetime updated_at "Last updated timestamp"
    }

    SLEEVE_INVENTORY {
        int id PK "Internal primary key"
        string format_name "Format name (e.g. Standard European)"
        real width_mm "Sleeve width in mm"
        real height_mm "Sleeve height in mm"
        string brand "Brand label (e.g. Mayday, Dragon Shield, Gamegenic)"
        int pack_size "Sleeves per pack (default 100 or 50)"
        int packs_owned "Full unopened packs owned"
        int loose_sleeves "Loose extra sleeves"
        string notes "Storage notes (e.g. Drawer 2)"
        datetime updated_at "Last updated timestamp"
    }

    SLEEVE_SHOPPING_ITEM {
        string dimension_key PK "Normalized key: width x height"
        string format_name "Display format name"
        int total_cards_needed "Total un-sleeved cards required"
        int total_stock_available "Available sleeves from inventory"
        int net_cards_deficit "Cards needing sleeve coverage"
        int packs_to_buy "Calculated packs to purchase"
        int pack_size "Assumed pack size for purchase"
    }
```

---

## 2. Table Definitions

### 2.1 `game_sleeves` Table
Stores sleeve requirements per game. Supports multiple card decks per title.
- `id`: `INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL`.
- `bgg_id`: `INTEGER NOT NULL REFERENCES games(bgg_id) ON DELETE CASCADE`.
- `card_set_name`: `TEXT NOT NULL DEFAULT 'Main Deck'`.
- `format_name`: `TEXT NOT NULL`.
- `width_mm`: `REAL NOT NULL`. Positive float (e.g. 63.5).
- `height_mm`: `REAL NOT NULL`. Positive float (e.g. 88.0).
- `card_count`: `INTEGER NOT NULL`. Count $\ge 1$.
- `is_sleeved`: `INTEGER NOT NULL DEFAULT 0`. Boolean ($1$ if sleeved, $0$ if pending).
- `created_at`: `INTEGER NOT NULL`. Timestamp.
- `updated_at`: `INTEGER NOT NULL`. Timestamp.

### 2.2 `sleeve_inventory` Table
Stores user-owned spare sleeve stock.
- `id`: `INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL`.
- `format_name`: `TEXT NOT NULL`.
- `width_mm`: `REAL NOT NULL`. Positive float.
- `height_mm`: `REAL NOT NULL`. Positive float.
- `brand`: `TEXT NOT NULL`.
- `pack_size`: `INTEGER NOT NULL DEFAULT 100`.
- `packs_owned`: `INTEGER NOT NULL DEFAULT 0`.
- `loose_sleeves`: `INTEGER NOT NULL DEFAULT 0`.
- `notes`: `TEXT`.
- `created_at`: `INTEGER NOT NULL`. Timestamp.
- `updated_at`: `INTEGER NOT NULL`. Timestamp.

